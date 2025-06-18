let home = 0, away = 0, sec = 0;

function updateTime() {
  sec++;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  document.getElementById('matchTime').textContent =
    `${min.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function randomGoal() {
  if (Math.random() < 0.05) {
    if (Math.random() < 0.5) home++; else away++;
    document.getElementById('homeScore').textContent = home;
    document.getElementById('awayScore').textContent = away;
  }
}

setInterval(() => {
  updateTime();
  randomGoal();
}, 1000);
