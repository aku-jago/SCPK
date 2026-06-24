/**
 * Skeleton Loading Component Generator
 */
const Skeleton = {
  text(width = '100%') {
    return `<div class="skeleton skeleton-text" style="width:${width}"></div>`;
  },
  title(width = '60%') {
    return `<div class="skeleton skeleton-title" style="width:${width}"></div>`;
  },
  avatar() {
    return `<div class="skeleton skeleton-avatar"></div>`;
  },
  card() {
    return `<div class="skeleton skeleton-card"></div>`;
  },
  statCards(count = 4) {
    let html = '<div class="stats-grid">';
    for (let i = 0; i < count; i++) {
      html += `<div class="stat-card"><div class="skeleton" style="width:40px;height:40px;border-radius:12px;margin-bottom:16px;"></div><div class="skeleton skeleton-title" style="width:50%;"></div><div class="skeleton skeleton-text" style="width:70%;"></div></div>`;
    }
    return html + '</div>';
  },
  table(rows = 5, cols = 4) {
    let html = '<div class="table-container"><table class="data-table"><thead><tr>';
    for (let c = 0; c < cols; c++) html += `<th><div class="skeleton skeleton-text" style="width:80px;"></div></th>`;
    html += '</tr></thead><tbody>';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) html += `<td><div class="skeleton skeleton-text" style="width:${60 + Math.random() * 40}%;"></div></td>`;
      html += '</tr>';
    }
    return html + '</tbody></table></div>';
  },
};
