import { useEffect, useState } from "react";
import { itemById } from "./menu";
import {
  DEFAULT_DEMO_SPEED,
  SLOT_COUNT,
  formatRemain,
  grillTimes,
  jobProgress,
  remainingMs,
  slotView,
  waitingJobs,
} from "./rack";
import { useShop } from "./ShopContext";

export function RackView() {
  const { jobs, demoSpeed, setDemoSpeed } = useShop();
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const slots = slotView(jobs);
  const waiting = waitingJobs(jobs);
  const roasting = jobs.filter((job) => job.slot !== null && job.doneAt === null).length;
  const accelerated = demoSpeed > 1;

  return (
    <section className="rack-panel" aria-label="自動烤肉架">
      <div className="rack-head">
        <div>
          <p className="kicker">減少人力</p>
          <h2>自動烤肉架</h2>
          <p className="muted">
            六鉤馬達翻面，不用人站在炭前面盯。肉上鉤之後自己轉、自己計時；時間到亮燈，去盛飯對號。
            同時最多 {SLOT_COUNT} 份，滿了就排隊等空鉤。
          </p>
        </div>
        <label className="speed-toggle">
          <input
            type="checkbox"
            checked={accelerated}
            onChange={(event) =>
              setDemoSpeed(event.target.checked ? DEFAULT_DEMO_SPEED : 1)
            }
          />
          加速示範（{DEFAULT_DEMO_SPEED} 倍，里肌 4 分鐘變成 8 秒）
        </label>
      </div>

      <div className="rack" role="list">
        {slots.map((job, index) => (
          <article
            key={index}
            className={job ? "hook on" : "hook"}
            role="listitem"
            aria-label={job ? `${grillTimes[job.itemId]?.short ?? "肉"} 第 ${index + 1} 鉤` : `空鉤 ${index + 1}`}
          >
            <small>鉤 {index + 1}</small>
            {job ? (
              <>
                <b>{grillTimes[job.itemId]?.short ?? itemById(job.itemId)?.name}</b>
                <span className="remain">{formatRemain(remainingMs(job, tick))}</span>
                <span className="track" aria-hidden="true">
                  <i style={{ width: `${jobProgress(job, tick) * 100}%` }} />
                </span>
              </>
            ) : (
              <span className="muted">空鉤</span>
            )}
          </article>
        ))}
      </div>
      <div className="coals" aria-hidden="true" />

      <p className="rack-meta">
        烤著 {roasting}／{SLOT_COUNT}
        {waiting.length > 0 ? ` · 等空鉤 ${waiting.length} 份` : " · 沒有排隊"}
        {accelerated ? " · 示範加速中" : " · 現場速度"}
      </p>
    </section>
  );
}
