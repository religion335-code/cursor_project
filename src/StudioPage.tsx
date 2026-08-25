import { useState } from "react";
import { WEEKLY_RITUAL } from "./catalog";
import { ntd } from "./money";
import { makeId } from "./quotes";
import { offerById } from "./runway";
import { useStudio } from "./studio-context";
import type { OfferId, ProjectStatus } from "./types";

const columns: { id: ProjectStatus; title: string }[] = [
  { id: "inquiry", title: "詢問" },
  { id: "active", title: "進行" },
  { id: "delivered", title: "交付" },
  { id: "retainer", title: "月費" },
];

export function StudioPage() {
  const { state, addProject, moveProject, toggleCheck, loadSample, reset } = useStudio();
  const [client, setClient] = useState("");
  const [title, setTitle] = useState("");
  const [offerId, setOfferId] = useState<OfferId>("spark");

  const booked = state.projects.reduce((sum, project) => sum + project.amount, 0);

  return (
    <article>
      <span className="kicker">一人公司後台</span>
      <h1>工作室</h1>
      <p className="lede">
        遠距的節奏靠看板，不靠靈感。案件、週儀式、已開報價都留在瀏覽器裡，換電腦前請自己匯出或截圖。
      </p>

      <section className="row stats">
        <div className="card stat">
          案件
          <b>{state.projects.length}</b>
        </div>
        <div className="card stat">
          報價
          <b>{state.quotes.length}</b>
        </div>
        <div className="card stat">
          看板金額
          <b>{ntd(booked)}</b>
        </div>
        <div className="card stat ink">
          示範資料
          <b>{state.sampleLoaded ? "已載入" : "未載入"}</b>
        </div>
      </section>

      <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <button className="btn forest" type="button" onClick={loadSample}>
          載入宜蘭示範案件
        </button>
        <button className="btn ghost" type="button" onClick={reset}>
          清空本機資料
        </button>
      </div>

      <section className="row halves">
        <form
          className="card form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!client.trim() || !title.trim()) return;
            const offer = offerById(offerId);
            addProject({
              id: makeId("p"),
              client: client.trim(),
              title: title.trim(),
              offerId,
              status: "inquiry",
              amount: offer.price,
              due: new Date().toISOString().slice(0, 10),
              notes: "",
            });
            setClient("");
            setTitle("");
          }}
        >
          <h2>新案件</h2>
          <input
            placeholder="客戶"
            value={client}
            onChange={(event) => setClient(event.target.value)}
          />
          <input
            placeholder="工作名稱"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <select
            value={offerId}
            onChange={(event) => setOfferId(event.target.value as OfferId)}
          >
            <option value="spark">火花診斷</option>
            <option value="build">可交件 Agent</option>
            <option value="retain">月費守夜</option>
          </select>
          <button className="btn" type="submit">
            放入詢問欄
          </button>
        </form>
        <div className="card">
          <h2>遠距週儀式</h2>
          {WEEKLY_RITUAL.map((task) => (
            <label className="check" key={task.id}>
              <input
                type="checkbox"
                checked={Boolean(state.checklist[task.id])}
                onChange={() => toggleCheck(task.id)}
              />
              <span>
                <strong>週{task.weekday} {task.title}</strong>
                <div className="muted">{task.detail}</div>
              </span>
            </label>
          ))}
        </div>
      </section>

      {state.quotes.length > 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>已存報價</h2>
          <table className="table">
            <thead>
              <tr>
                <th>客戶</th>
                <th>方案</th>
                <th>金額</th>
              </tr>
            </thead>
            <tbody>
              {state.quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>{quote.client}</td>
                  <td>{offerById(quote.offerId).name}</td>
                  <td>{ntd(quote.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="kanban" style={{ marginTop: 16 }}>
        {columns.map((column) => (
          <section key={column.id}>
            <strong>{column.title}</strong>
            {state.projects
              .filter((project) => project.status === column.id)
              .map((project) => (
                <article className="ticket" key={project.id}>
                  <b>{project.client}</b>
                  <div>{project.title}</div>
                  <div className="muted">
                    {ntd(project.amount)} · {offerById(project.offerId).name}
                  </div>
                  <select
                    value={project.status}
                    onChange={(event) =>
                      moveProject(project.id, event.target.value as ProjectStatus)
                    }
                    style={{ marginTop: 8 }}
                  >
                    {columns.map((item) => (
                      <option key={item.id} value={item.id}>
                        移到{item.title}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
          </section>
        ))}
      </div>
    </article>
  );
}
