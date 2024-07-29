const GoogleFormEmbed = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "60vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <iframe
        src="https://forms.gle/FzcHPa5vikMnW51H7"
        width="80%"
        height="90%"
        style={{
          borderRadius: "15px",
          overflow: "hidden",
        }}
      >
        Loading…
      </iframe>
    </div>
  );
};

export default GoogleFormEmbed;
