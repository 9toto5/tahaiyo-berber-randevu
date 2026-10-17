import test from "node:test";
import assert from "node:assert/strict";
import {
  availableSlots,
  createInitialState,
  localDate,
  validateBooking,
} from "./domain";

const morning = new Date(2026, 0, 12, 8, 0);
const date = "2026-01-12";

function fresh() {
  const state = createInitialState(morning);
  state.appointments = [];
  return state;
}

test("local dates stay in the local calendar and keep leading zeros", () => {
  assert.equal(localDate(new Date(2026, 0, 2, 0, 0)), "2026-01-02");
});

test("availability respects service duration, breaks, and closing time", () => {
  const slots = availableSlots(fresh(), "emre", "combo", date, morning);
  assert.equal(slots[0], "09:00");
  assert.equal(slots.at(-1), "21:00");
  assert.ok(slots.includes("12:00"));
  assert.ok(!slots.includes("12:30"));
  assert.ok(!slots.includes("13:00"));
  assert.ok(!slots.includes("13:30"));
  assert.ok(slots.includes("14:00"));
});

test("overlapping appointments block their complete duration and cancellation releases them", () => {
  const state = fresh();
  state.appointments.push({
    id: "one",
    customerId: "deniz",
    staffId: "emre",
    serviceId: "color",
    date,
    time: "10:00",
    price: 900,
    duration: 90,
    status: "confirmed",
  });
  const slots = availableSlots(state, "emre", "combo", date, morning);
  assert.ok(slots.includes("09:00"));
  for (const time of ["09:30", "10:00", "10:30", "11:00"])
    assert.ok(!slots.includes(time));
  assert.ok(slots.includes("11:30"));
  state.appointments[0].status = "cancelled";
  assert.ok(
    availableSlots(state, "emre", "combo", date, morning).includes("10:00"),
  );
});

test("past days and times, malformed dates, and closed days have no slots", () => {
  const state = fresh();
  assert.deepEqual(
    availableSlots(state, "emre", "haircut", "2026-01-11", morning),
    [],
  );
  assert.deepEqual(
    availableSlots(state, "emre", "haircut", "2026-01-18", morning),
    [],
  );
  assert.deepEqual(
    availableSlots(state, "emre", "haircut", "2026-02-31", morning),
    [],
  );
  assert.deepEqual(
    availableSlots(state, "emre", "haircut", "bad-input", morning),
    [],
  );
  assert.equal(
    availableSlots(
      state,
      "emre",
      "haircut",
      date,
      new Date(2026, 0, 12, 9, 30),
    )[0],
    "10:00",
  );
});

test("disabled services and inclusive date ranges for leave prevent bookings", () => {
  const state = fresh();
  assert.deepEqual(availableSlots(state, "mert", "color", date, morning), []);
  state.staff[0].leaves.push({
    id: "leave",
    date,
    endDate: "2026-01-14",
    reason: "İzin",
  });
  assert.deepEqual(availableSlots(state, "emre", "haircut", date, morning), []);
  assert.deepEqual(
    availableSlots(state, "emre", "haircut", "2026-01-14", morning),
    [],
  );
  assert.ok(
    availableSlots(state, "emre", "haircut", "2026-01-15", morning).length > 0,
  );
});

test("a customer cannot book overlapping times with different staff", () => {
  const state = fresh();
  const user = state.users.find((item) => item.id === "deniz")!;
  state.appointments.push({
    id: "one",
    customerId: "deniz",
    staffId: "can",
    serviceId: "color",
    date,
    time: "10:00",
    price: 900,
    duration: 90,
    status: "confirmed",
  });
  const request = {
    staffId: "emre",
    serviceId: "haircut",
    date,
    time: "10:30",
  };
  assert.ok(
    validateBooking(state, user, request, morning)?.includes(
      "başka bir randevunuz",
    ),
  );
  assert.equal(
    validateBooking(state, user, { ...request, time: "11:30" }, morning),
    undefined,
  );
  assert.ok(validateBooking(state, null, request, morning));
  assert.ok(validateBooking(state, state.users[0], request, morning));
});

test("staff-specific hours and durations immediately affect future availability", () => {
  const state = fresh();
  state.staff[0].hours[1] = {
    day: 1,
    enabled: true,
    start: "10:00",
    end: "12:00",
    breakStart: "",
    breakEnd: "",
  };
  state.staff[0].services.find(
    (item) => item.serviceId === "haircut",
  )!.duration = 90;
  assert.deepEqual(availableSlots(state, "emre", "haircut", date, morning), [
    "10:00",
    "10:30",
  ]);
});
