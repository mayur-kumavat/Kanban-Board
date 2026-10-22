export default function Boards() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return <h2 style={{ padding: 24 }}>Logged in as {user?.name}</h2>;
}