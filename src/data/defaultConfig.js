export const defaultConfig = {
  adminPassword: "admin123",
  sheetsServicesUrl: "",
  sheetsExtrasUrl: "",
  _lastSync: null,
  services: [
    {
      id: "corporate",
      label: "Corporativo",
      lengths: [
        { id: "1-3", label: "1 a 3 minutos", price: 450 },
        { id: "3-5", label: "3 a 5 minutos", price: 510 },
        { id: "5-10", label: "5 a 10 minutos", price: 625 },
        { id: "10-20", label: "10 a 20 minutos", price: 800 },
      ],
    },
    {
      id: "documental",
      label: "Documental",
      lengths: [
        { id: "1-3", label: "1 a 3 minutos", price: 490 },
        { id: "3-5", label: "3 a 5 minutos", price: 525 },
        { id: "5-10", label: "5 a 10 minutos", price: 625 },
        { id: "10-20", label: "10 a 20 minutos", price: 820 },
      ],
    },
    {
      id: "bodas",
      label: "Bodas",
      lengths: [
        { id: "3-5", label: "3 a 5 minutos", price: 510 },
        { id: "5-10", label: "5 a 10 minutos", price: 625 },
        { id: "10-20", label: "10 a 20 minutos", price: 820 },
      ],
    },
    {
      id: "video-musical",
      label: "Video musical",
      lengths: [
        { id: "3-5", label: "3 a 5 minutos", price: 550 },
        { id: "5-10", label: "5 a 10 minutos", price: 600 },
      ],
    },
    {
      id: "resumen-evento",
      label: "Resumen de evento / Highlights",
      lengths: [
        { id: "1-3", label: "1 a 3 minutos", price: 350 },
        { id: "3-5", label: "3 a 5 minutos", price: 450 },
        { id: "5-10", label: "5 a 10 minutos", price: 550 },
      ],
    },
    {
      id: "bienes-raices",
      label: "Bienes raíces",
      lengths: [
        { id: "1-3", label: "1 a 3 minutos", price: 350 },
        { id: "3-5", label: "3 a 5 minutos", price: 450 },
      ],
    },
    {
      id: "naturaleza",
      label: "Naturaleza",
      lengths: [
        { id: "1-3", label: "1 a 3 minutos", price: 490 },
        { id: "3-5", label: "3 a 5 minutos", price: 525 },
        { id: "5-10", label: "5 a 10 minutos", price: 625 },
      ],
    },
    {
      id: "comercial-producto",
      label: "Comercial de producto",
      lengths: [
        { id: "1-3", label: "1 a 3 minutos", price: 350 },
      ],
    },
  ],
  extras: [
    { id: "drone", label: "Dron", price: 70 },
    { id: "camarografo", label: "Camarógrafo / Unidad", price: 145 },
    { id: "iluminacion", label: "Iluminación de estudio", price: 60 },
    { id: "camara-extra", label: "Cámara extra", price: 50 },
    { id: "microfonia", label: "Microfonía", price: 60 },
    { id: "viatico", label: "Viático / Gasolina", price: 40 },
  ],
}
