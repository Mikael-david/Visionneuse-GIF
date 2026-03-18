const animation = lottie.loadAnimation({
  container: document.getElementById("myIcon"),
  renderer: "svg",
  loop: false,
  autoplay: false,
  path: "assets/icons/icons8-sun.json", // chemin vers le fichier JSON
});

const icon = document.getElementById("myIcon");