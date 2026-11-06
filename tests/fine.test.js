const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFine } = require('../server');

test('no fine when returned on due date', () => {
  assert.deepEqual(calculateFine('2026-11-06','2026-11-06',5), {daysLate:0,fine:0});
});
test('calculates overdue fine by late days', () => {
  assert.deepEqual(calculateFine('2026-11-01','2026-11-04',5), {daysLate:3,fine:15});
});
test('no negative fine for early return', () => {
  assert.deepEqual(calculateFine('2026-11-10','2026-11-06',5), {daysLate:0,fine:0});
});