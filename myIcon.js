const animation = lottie.loadAnimation({
  container: document.getElementById("myIcon"),
  renderer: "svg",
  loop: false,
  autoplay: false,
  path: "icons8-sun.json", // chemin vers ton fichier JSON
});

const icon = document.getElementById("myIcon");