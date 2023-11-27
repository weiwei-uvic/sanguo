function setTitle(){
    const svg = d3.select("#title-container").append("svg");
    svg.append("text")
    .text("The Heroes, Villains and Beyond")
    .attr("alignment-baseline", "central")
    .attr("font-size", 20)
    .attr("fill", "#000")
    .attr("white-space", "nowrap")
    // .attr("overflow", "hidden")
    .attr("text-overflow", "ellipsis");
}