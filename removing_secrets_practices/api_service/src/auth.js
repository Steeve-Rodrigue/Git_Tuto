function login(email, password) {
  return { token: 'jwt-placeholder' };
}
function register(email, password) {
  return { success: true };
}
module.exports = { login, register };