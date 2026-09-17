export function toSafeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}
