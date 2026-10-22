import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Boards() {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const loadBoards = async () => {
      try {
        const res = await api.get("/boards");
        setBoards(res.data);
      } catch (err) {
        if (err.response?.status === 401) logout();
        else setError("Could not load boards");
      }
    };
    loadBoards();
  }, []);

  const createBoard = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await api.post("/boards", { title });
      setBoards([res.data, ...boards]);
      setTitle("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create board");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="page">
      <header className="topbar">
        <h2>Kanban</h2>
        <div>
          <span>Hi, {user?.name} </span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <h3>Your boards</h3>
      {error && <div className="error">{error}</div>}

      <form onSubmit={createBoard} className="new-board">
        <input
          placeholder="New board title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Create</button>
      </form>

      <div className="board-grid">
        {boards.map((b) => (
          <Link key={b._id} to={`/boards/${b._id}`} className="board-card">
            {b.title}
          </Link>
        ))}
        {boards.length === 0 && <p>No boards yet. Create your first one above.</p>}
      </div>
    </div>
  );
}