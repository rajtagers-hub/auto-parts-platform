import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadAllUsersPDF(users: any[], parts: any[]) {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString("sq-AL", { month: "long", year: "numeric" });

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("VEKTRA - Raport Mujor", 14, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${dateStr}`, 14, 30);
  doc.text(`Total Perdorues: ${users.length}`, 14, 36);

  const tableData = users.map(user => {
    const userParts = parts.filter(p => p.seller_id === user.id);
    const activeParts = userParts.filter(p => p.status === "Active");
    return [
      user.name || "—",
      user.email || "—",
      user.user_type || "—",
      user.city || "—",
      user.status || "—",
      String(activeParts.length),
      `${user.current_debt || 0}€`,
      `${user.total_paid || 0}€`,
    ];
  });

  autoTable(doc, {
    startY: 42,
    head: [["Emri", "Email", "Tipi", "Qyteti", "Statusi", "Pjese", "Borxhi", "Paguar"]],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`raport-mujor-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`);
}

export function downloadSingleUserPDF(user: any, parts: any[]) {
  const doc = new jsPDF();
  const now = new Date();
  const userParts = parts.filter(p => p.seller_id === user.id);

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("VEKTRA - Raport Individual", 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Emri: ${user.name || "—"}`, 14, 34);
  doc.text(`Email: ${user.email || "—"}`, 14, 40);
  doc.text(`Tipi: ${user.user_type || "—"}`, 14, 46);
  doc.text(`Qyteti: ${user.city || "—"}`, 14, 52);
  doc.text(`Statusi: ${user.status || "—"}`, 14, 58);
  doc.text(`Borxhi Aktual: ${user.current_debt || 0}€`, 14, 64);
  doc.text(`Total Paguar: ${user.total_paid || 0}€`, 14, 70);
  doc.text(`Pjese Aktive: ${userParts.filter(p => p.status === "Active").length} / ${userParts.length}`, 14, 76);

  const tableData = userParts.map(p => [
    p.title || "—",
    `${p.price || 0}€`,
    p.model || "—",
    String(p.year || "—"),
    p.status || "—",
    p.created_at ? new Date(p.created_at).toLocaleDateString("sq-AL") : "—",
  ]);

  autoTable(doc, {
    startY: 84,
    head: [["Titulli", "Cmimi", "Modeli", "Viti", "Statusi", "Data"]],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  const safeName = (user.name || "user").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`raport-${safeName}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`);
}
