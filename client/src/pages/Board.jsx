import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";

export default function Board() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [newColumn, setNewColumn] = useState("");
  const [newCards, setNewCards] = useState({}); // { columnId: "typed text" }
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/columns/board/${id}`);
        setBoard(res.data.board);
        setColumns(res.data.columns);
        setCards(res.data.cards);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load board");
      }
    };
    load();
  }, [id]);

  const addColumn = async (e) => {
    e.preventDefault();
    if (!newColumn.trim()) return;
    try {
      const res = await api.post(`/columns/board/${id}`, { title: newColumn });
      setColumns([...columns, res.data]);
      setNewColumn("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not add column");
    }
  };

  const addCard = async (e, columnId) => {
    e.preventDefault();
    const title = newCards[columnId];
    if (!title || !title.trim()) return;
    try {
      const res = await api.post(`/columns/${columnId}/cards`, { title });
      setCards([...cards, res.data]);
      setNewCards({ ...newCards, [columnId]: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Could not add card");
    }
  };

  const deleteCard = async (cardId) => {
    try {
      await api.delete(`/cards/${cardId}`);
      setCards(cards.filter((c) => c._id !== cardId));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete card");
    }
  };

  if (error && !board) {
    return (
      <div className="page">
        <div className="error">{error}</div>
        <Link to="/boards">Back to boards</Link>
      </div>
    );
  }
  if (!board) return <div className="page">Loading...</div>;

  return (
    <div className="page wide">
      <header className="topbar">
        <h2>{board.title}</h2>
        <Link to="/boards">Back to boards</Link>
      </header>
      {error && <div className="error">{error}</div>}

      <div className="columns">
        {columns.map((col) => (
          <div key={col._id} className="column">
            <h4>{col.title}</h4>

            {cards
              .filter((card) => card.column === col._id)
              .map((card) => (
                <div key={card._id} className="card">
                  <span>{card.title}</span>
                  <button className="x" onClick={() => deleteCard(card._id)}>×</button>
                </div>
              ))}

            <form onSubmit={(e) => addCard(e, col._id)}>
              <input
                placeholder="+ Add a card"
                value={newCards[col._id] || ""}
                onChange={(e) => setNewCards({ ...newCards, [col._id]: e.target.value })}
              />
            </form>
          </div>
        ))}

        <form onSubmit={addColumn} className="column new-column">
          <input
            placeholder="+ Add a column"
            value={newColumn}
            onChange={(e) => setNewColumn(e.target.value)}
          />
        </form>
      </div>
    </div>
  );
}