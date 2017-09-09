importScripts("https://d3js.org/d3.v4.min.js");

onmessage = function(event) {
  var nodes = event.data.nodes,
      links = event.data.links,
      width = event.data.width,
      height = event.data.height;


  var simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-18))
    .force("x", d3.forceX(0))
    .force("y", d3.forceY(0))
    .stop();

  for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
    postMessage({type: "tick", progress: i / n});
    simulation.tick();
  }

  postMessage({type: "end", nodes: nodes, links: links});
};