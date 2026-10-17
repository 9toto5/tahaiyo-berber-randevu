import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createInitialState, validateBooking } from "./domain";
import type { BookingInput, SalonState, Staff, User } from "./types";

export { availableSlots, dateLabel, formatMoney, localDate } from "./domain";

const DATA_KEY = "boss-salon-demo-v1";
const SESSION_KEY = "boss-salon-session-v1";

function readState(): SalonState {
  try {
    const value = localStorage.getItem(DATA_KEY);
    if (value) {
      const parsed = JSON.parse(value) as SalonState;
      if (
        Array.isArray(parsed.users) &&
        Array.isArray(parsed.staff) &&
        Array.isArray(parsed.services) &&
        Array.isArray(parsed.appointments)
      )
        return parsed;
    }
  } catch {
    /* A fresh demo also works when browser storage is unavailable. */
  }
  return createInitialState();
}

function readSession(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

type SalonContextValue = {
  state: SalonState;
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  bookAppointment: (input: BookingInput) => { ok: boolean; error?: string };
  cancelAppointment: (id: string) => void;
  completeAppointment: (id: string) => void;
  updateStaff: (id: string, patch: Partial<Staff>) => void;
  resetDemo: () => void;
};

const SalonContext = createContext<SalonContextValue | null>(null);

export function SalonProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SalonState>(readState);
  const stateRef = useRef(state);
  const [session, setSession] = useState<string | null>(readSession);
  const sessionRef = useRef(session);
  const user = state.users.find((item) => item.id === session) ?? null;

  function save(next: SalonState) {
    stateRef.current = next;
    setState(next);
  }

  function setUser(id: string | null) {
    sessionRef.current = id;
    setSession(id);
  }

  function currentUser() {
    return (
      stateRef.current.users.find((item) => item.id === sessionRef.current) ??
      null
    );
  }

  useEffect(() => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(state));
    } catch {
      /* Session stays usable in memory. */
    }
  }, [state]);

  useEffect(() => {
    try {
      if (session) sessionStorage.setItem(SESSION_KEY, session);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* Session stays usable in memory. */
    }
  }, [session]);

  useEffect(() => {
    const syncDemo = (event: StorageEvent) => {
      if (event.key !== DATA_KEY || !event.newValue) return;
      try {
        const next = JSON.parse(event.newValue) as SalonState;
        if (
          !Array.isArray(next.users) ||
          !Array.isArray(next.staff) ||
          !Array.isArray(next.services) ||
          !Array.isArray(next.appointments)
        )
          return;
        stateRef.current = next;
        setState(next);
      } catch {
        /* Ignore unrelated or invalid storage writes. */
      }
    };
    window.addEventListener("storage", syncDemo);
    return () => window.removeEventListener("storage", syncDemo);
  }, []);

  const value: SalonContextValue = {
    state,
    user,
    login(email, password) {
      const match = stateRef.current.users.find(
        (item) =>
          item.email.toLowerCase() === email.trim().toLowerCase() &&
          item.password === password,
      );
      if (!match) return false;
      setUser(match.id);
      return true;
    },
    logout() {
      setUser(null);
    },
    bookAppointment(input) {
      const current = stateRef.current;
      const signedIn = currentUser();
      const error = validateBooking(current, signedIn, input);
      if (error) return { ok: false, error };
      const service = current.staff
        .find((item) => item.id === input.staffId)!
        .services.find((item) => item.serviceId === input.serviceId)!;
      save({
        ...current,
        appointments: [
          ...current.appointments,
          {
            id:
              globalThis.crypto?.randomUUID?.() ??
              `appointment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            customerId: signedIn!.id,
            staffId: input.staffId,
            serviceId: input.serviceId,
            date: input.date,
            time: input.time,
            note: input.note?.trim().slice(0, 500) || undefined,
            price: service.price,
            duration: service.duration,
            status: "confirmed",
          },
        ],
      });
      return { ok: true };
    },
    cancelAppointment(id) {
      const current = stateRef.current;
      const signedIn = currentUser();
      const target = current.appointments.find((item) => item.id === id);
      if (!signedIn || !target || target.status !== "confirmed") return;
      if (
        signedIn.role === "customer"
          ? target.customerId !== signedIn.id
          : target.staffId !== signedIn.staffId
      )
        return;
      save({
        ...current,
        appointments: current.appointments.map((item) =>
          item.id === id ? { ...item, status: "cancelled" } : item,
        ),
      });
    },
    completeAppointment(id) {
      const current = stateRef.current;
      const signedIn = currentUser();
      const target = current.appointments.find((item) => item.id === id);
      if (
        signedIn?.role !== "staff" ||
        !target ||
        target.staffId !== signedIn.staffId ||
        target.status !== "confirmed"
      )
        return;
      save({
        ...current,
        appointments: current.appointments.map((item) =>
          item.id === id ? { ...item, status: "completed" } : item,
        ),
      });
    },
    updateStaff(id, patch) {
      const current = stateRef.current;
      const signedIn = currentUser();
      if (signedIn?.role !== "staff" || signedIn.staffId !== id) return;
      save({
        ...current,
        staff: current.staff.map((item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
                id,
                initials: (patch.name || item.name)
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join(""),
              }
            : item,
        ),
        users: patch.name
          ? current.users.map((item) =>
              item.staffId === id ? { ...item, name: patch.name! } : item,
            )
          : current.users,
      });
    },
    resetDemo() {
      save(createInitialState());
      setUser(null);
    },
  };

  return (
    <SalonContext.Provider value={value}>{children}</SalonContext.Provider>
  );
}

export function useSalon(): SalonContextValue {
  const context = useContext(SalonContext);
  if (!context) throw new Error("useSalon must be used inside SalonProvider");
  return context;
}
