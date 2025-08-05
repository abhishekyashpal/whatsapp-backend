import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const res = http.get('http://nginx'); // or http://backend:3000 if NGINX isn't up yet
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
