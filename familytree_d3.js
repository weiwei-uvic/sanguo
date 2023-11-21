function Familytree(IndividualData, familyRoot, highlightPID, posX, posY)
{
    console.log("###", posX)
    const div = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    var Treedx = 20;
    var Treedy = 100;
  //  root.dy = width / (root.height+1);
    const root = d3.tree().nodeSize([Treedx, Treedy])(familyRoot);
    var i = 0;
    root.each((d) => {
        d.x = posX[i];
        d.y = posY[i];
        i++;
      });


    let x0 = Infinity;
    let x1 = -x0;
    root.each(d => {
        if (d.x > x1) x1 = d.x;
        if (d.x < x0) x0 = d.x;
    });

    const svg =  d3.select("#familytree-chart").attr("width", 1000).attr("height", 1000);
    svg.selectAll("*").remove();
    const g = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("transform", `translate(${Treedy / 3},${Treedx - x0})`);
        
    const link = g.append("g")
        .attr("fill", "none")
        .attr("stroke", "red") //#555
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));
    
    const node = g.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);
    
    const mouseover = node => {
        let InID = node.data.value-1; 
        let words = IndividualData[InID]["Note"].split("。");
        //words.pop();
        let content = "";
        words.forEach(w => {
        content += `<p  style="font-size: smaller;">${w}</p>`;
        });
        div
        .transition()
        .duration(200)
        .style("opacity", 0.9);
        div
        .html(content)
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY + "px")
        .style("transform", "translate(0, -60%)");
    };
    const mouseout = node => {
        div
            .transition()
            .duration(200)
            .style("opacity", 0);
    };

    node.append("circle")
        .attr("fill", d => d.value == highlightPID? "#fc4e2a" : "#999")
        .attr("r", 4)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
    
    node.append("text")
        .attr("dy", "0.31em")
        .attr("fill",  d => d.value == highlightPID? "#fc4e2a" : "#black")
        .attr("x", d => d.children ? -6 : 6)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => IndividualData[d.data.value-1]["Name_cn"])
        .clone(true).lower();
        
}
