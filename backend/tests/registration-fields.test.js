import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registrationFields } from '../src/modules/commerce/registration.js';
test('every actual intake form field is persisted by the approved contract or explicitly privacy-gated', () => {
  for (const [kind, path] of [['study', 'components/auth/StudyRegistrationForm.jsx'], ['tuition', 'components/auth/TuitionCoachingForm.jsx'], ['teacher', 'components/auth/TeacherProfessorForm.jsx'], ['coaching-profile', 'pages/coaching/CourseRegistrationPage.jsx']]) {
    const source = readFileSync(new URL('../../frontend/src/modules/user/' + path, import.meta.url), 'utf8');
    const start = source.indexOf('const [formData, setFormData] = useState({'); assert.ok(start >= 0, path);
    const shape = source.slice(start, source.indexOf('});', start));
    const fields = [...shape.matchAll(/^\s+(\w+):/gm)].map(m => m[1]); assert.ok(fields.length >= 9, path);
    const safe = fields.filter(name => !/File$|Preview$|^aadharNumber$/.test(name));
    assert.deepEqual(safe.sort(), registrationFields[kind].split(' ').sort(), kind + ': frontend fields and backend allowlist differ');
  }
});
