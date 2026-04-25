import bcrypt from 'bcryptjs';

const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeI3ZAgcif7p9nLSU5h7HS1tG9qxJ3KWi';
const password = 'admin123';

const match = bcrypt.compareSync(password, hash);
console.log('Match:', match);

if (!match) {
  console.log('Generating correct hash for admin123:');
  console.log(bcrypt.hashSync('admin123', 10));
}
