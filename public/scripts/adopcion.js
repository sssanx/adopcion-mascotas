export function initAdopcion() {
  console.log("✔ Script adopción cargado");

  const botones = document.querySelectorAll(".btn-adoptar");

  botones.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const mascota_id = btn.dataset.id;
      const nombre = btn.dataset.nombre;

      console.log("Mascota ID enviado:", mascota_id);

      if (!mascota_id) {
        alert("❌ Error: mascota_id no encontrado.");
        return;
      }

      const confirmar = confirm(`¿Deseas adoptar a ${nombre}?`);
      if (!confirmar) return;

      try {
        const res = await fetch("/api/adopciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario_id: 1,    // LO QUE TÚ PEDISTE (igual que antes)
            mascota_id: mascota_id,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert("❌ Error: " + data.error);
          console.error(data.detail);
          return;
        }

        alert(`🎉 ¡Has adoptado a ${nombre}!`);
        location.reload();

      } catch (err) {
        console.error("Error en adopción:", err);
        alert("⚠ Error de conexión");
      }
    });
  });
}
