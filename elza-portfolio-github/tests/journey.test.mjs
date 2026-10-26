import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePriority, cleanIds, toggleSaved, readPreference, savePreference, stops } from '../dist/journey.mjs';

test('all 16 priority combinations match the current Fluxo Inteligente matrix', () => {
  const expected = ['DDCB', 'CCBB', 'CCBA', 'BBAA'];
  const impacts = ['baixo', 'medio', 'alto', 'critico'];
  const urgencies = ['baixa', 'media', 'alta', 'critica'];
  impacts.forEach((impact, row) => urgencies.forEach((urgency, column) => {
    assert.equal(calculatePriority(impact, urgency).code, expected[row][column]);
  }));
  assert.match(calculatePriority('alto', 'critica').explanation, /prioridade crítica/);
  assert.throws(() => calculatePriority('qualquer', 'alta'), RangeError);
  assert.throws(() => calculatePriority('alto', 'unknown'), RangeError);
});

test('saved journeys and projects reject stale or untrusted IDs and deduplicate', () => {
  assert.deepEqual(cleanIds(['sobre','sobre','bad',null,7,'contato'], stops), ['sobre','contato']);
  assert.deepEqual(cleanIds({sobre:true}, stops), []);
  assert.deepEqual(toggleSaved(['fluxo'], 'fluxo', ['fluxo','lacrei']), []);
  assert.deepEqual(toggleSaved(['fluxo'], 'lacrei', ['fluxo','lacrei']), ['fluxo','lacrei']);
  assert.deepEqual(toggleSaved(['fluxo','bad'], 'bad', ['fluxo','lacrei']), ['fluxo']);
});

test('private local preferences tolerate denial, corrupt data and missing storage', () => {
  const map = new Map();
  const storage = {getItem:key => map.get(key) ?? null,setItem:(key,value) => map.set(key,value)};
  assert.equal(readPreference(storage, 'missing', false), false);
  assert.equal(savePreference(storage, 'saved', ['fluxo']), true);
  assert.deepEqual(readPreference(storage, 'saved', []), ['fluxo']);
  map.set('bad', '{invalid');
  assert.deepEqual(readPreference(storage, 'bad', []), []);
  assert.equal(readPreference(undefined, 'any', false), false);
  assert.equal(savePreference(undefined, 'any', []), false);
  const denied = {getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
  assert.deepEqual(readPreference(denied, 'saved', []), []);
  assert.equal(savePreference(denied, 'saved', []), false);
});
