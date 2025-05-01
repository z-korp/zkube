const GoogleFormEmbed = () => {
  return (
    <div className="w-full h-full pt-4 mx-auto">
      <iframe
        src="https://forms.gle/FzcHPa5vikMnW51H7"
        className="mx-auto"
        style={{
          width: "95%",
          height: "100%",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        Loading…
      </iframe>
    </div>
  );
};

export default GoogleFormEmbed;
