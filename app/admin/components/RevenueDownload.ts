export function downloadUserRevenueCSV(users: any[], parts: any[]) {
  const now = new Date();
  const monthName = now.toLocaleString("sq-AL", { month: "long", year: "numeric" });

  // Build CSV header
  const headers = [
    "Emri",
    "Email",
    "Tipi",
    "Qyteti",
    "Statusi",
    "Pjesë Aktive",
    "Pjesë Totale",
    "Borxhi Aktual (€)",
    "Total Paguar (€)",
    "Data e Pagesës së Fundit",
    "Data e Regjistrimit",
  ];

  const rows = users.map(user => {
    const userParts = parts.filter(p => p.seller_id === user.id);
    const activeParts = userParts.filter(p => p.status === "Active");

    return [
      user.name || "",
      user.email || "",
      user.user_type || "",
      user.city || "",
      user.status || "",
      activeParts.length,
      userParts.length,
      user.current_debt || 0,
      user.total_paid || 0,
      user.last_payment_date || "—",
      user.created_at ? new Date(user.created_at).toLocaleDateString("sq-AL") : "—",
    ];
  });

  // Escape CSV values
  const escape = (val: any) => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escape).join(","),
    ...rows.map(row => row.map(escape).join(",")),
  ].join("\n");

  // Add BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `raport-mujor-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadSingleUserRevenueCSV(user: any, parts: any[]) {
  const now = new Date();
  const userParts = parts.filter(p => p.seller_id === user.id);

  const headers = ["Titulli", "Çmimi (€)", "Modeli", "Viti", "Statusi", "Data e Krijimit"];

  const rows = userParts.map(p => [
    p.title || "",
    p.price || 0,
    p.model || "",
    p.year || "",
    p.status || "",
    p.created_at ? new Date(p.created_at).toLocaleDateString("sq-AL") : "—",
  ]);

  const escape = (val: any) => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Summary section
  const summary = [
    `Raporti për: ${user.name || user.email}`,
    `Email: ${user.email}`,
    `Tipi: ${user.user_type}`,
    `Borxhi Aktual: ${user.current_debt || 0}€`,
    `Total Paguar: ${user.total_paid || 0}€`,
    `Pjesë Aktive: ${userParts.filter(p => p.status === "Active").length}`,
    `Pjesë Totale: ${userParts.length}`,
    "",
  ];

  const csvContent = [
    ...summary,
    headers.map(escape).join(","),
    ...rows.map(row => row.map(escape).join(",")),
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = (user.name || "user").replace(/[^a-zA-Z0-9]/g, "_");
  link.download = `raport-${safeName}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
