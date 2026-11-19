import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api from "../api";

export default function Board() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [newColumn, setNewColumn] = useState("");
  const [newCards, setNewCards] = useState({});
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

  // Cards of one column, in order
  const cardsOf = (columnId) =>
    cards
      .filter((c) => c.column === columnId)
      .sort((a, b) => a.position - b.position);

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return; // dropped outside any column
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return; // dropped back where it started
    }

    // 1. Build the new ordered list for every column
    const lists = {};
    columns.forEach((col) => {
      lists[col._id] = cardsOf(col._id);
    });
    const [moved] = lists[source.droppableId].splice(source.index, 1);
    lists[destination.droppableId].splice(destination.index, 0, {
      ...moved,
      column: destination.droppableId,
    });

    // 2. Renumber positions 0,1,2... and collect what to save
    const affected = new Set([source.droppableId, destination.droppableId]);
    const newCards = [];
    const updates = [];
    Object.entries(lists).forEach(([columnId, list]) => {
      list.forEach((card, index) => {
        newCards.push({ ...card, position: index });
        if (affected.has(columnId)) {
          updates.push({ id: card._id, column: columnId, position: index });
        }
      });
    });

    // 3. Update the screen right away, remember the old state
    const previous = cards;
    setCards(newCards);

    // 4. Save in the background, undo if it fails
    try {
      await api.put("/cards/reorder", { boardId: id, updates });
    } catch (err) {
      setCards(previous);
      setError("Could not save the move, so it was undone");
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

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="columns">
          {columns.map((col) => (
            <div key={col._id} className="column">
              <h4>{col.title}</h4>

              <Droppable droppableId={col._id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`card-list ${snapshot.isDraggingOver ? "over" : ""}`}
                  >
                    {cardsOf(col._id).map((card, index) => (
                      <Draggable key={card._id} draggableId={card._id} index={index}>
                        {(drag, dragSnapshot) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={`card ${dragSnapshot.isDragging ? "dragging" : ""}`}
                          >
                            <span>{card.title}</span>
                            <button className="x" onClick={() => deleteCard(card._id)}>
                              ×
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

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
      </DragDropContext>
    </div>
  );
}