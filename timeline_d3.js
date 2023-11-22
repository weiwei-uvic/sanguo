const BAR_HEIGHT = 10;
const DATA_TYPE1 = "birthAndDeath";
const DATA_TYPE2 = "birthOnly";
const DATA_TYPE3 = "deathOnly";
const DATA_TYPE4 = "noBirthOrDeath";

var barFillColors = {};

var ChartHeight;
var XScale;
var YScale;
var FamilytreeRoots = {};
var AllData;
var Filters = [];

function Timeline(data, familytreeDicts) {
    console.log("###### Timeline is called", Filters);
    AllData = data;

    FamilytreeRoots = familytreeDicts;
    // Chart dimensions and configuration
    const margin = ({ top: 10, right: 20, bottom: 50, left: 20 }); // Increase bottom margin
    const width = 1000;
  
    const timelineData = AllData.filter(d => !Filters.includes(d.Type) && d.Type != DATA_TYPE4);

    // Calculate max of the death year and min of the birth year
    const maxYear = Math.max(...timelineData.map(d => d.Death_year)) + 20;
    const minYear = Math.min(...timelineData.map(d => d.Birth_year)) - 20;
    // Compute the y position for each bar
    const yPos = computeBarYPosition(timelineData, "center");
  
    // Calculate the maximum yPos value and the height of the chart
    const yPosMax = yPos[Object.keys(yPos).reduce((a, b) => yPos[a] > yPos[b] ? a : b)];
    const yPosMin = yPos[Object.keys(yPos).reduce((a, b) => yPos[a] < yPos[b] ? a : b)];

    ChartHeight = (yPosMax - yPosMin) * BAR_HEIGHT * 2;
    const height = ChartHeight + margin.top + margin.bottom;

    // Create X and Y scales
    XScale = d3.scaleLinear().domain([minYear, maxYear]).range([margin.left, width - margin.right]);
    YScale = d3.scalePoint().domain(d3.range(yPosMin, yPosMax + 1)).range([height - margin.bottom, margin.top]).padding(1.5);
    

    // --- clear svgs
    d3.select("#chart-container").selectAll('svg').remove();
    d3.select("#axis-container").selectAll('svg').remove();
    const svg = d3.select("#chart-container")//(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style('bottom', '0')
    // Bar fill color
    createGradient(svg);
    barFillColors = {birthAndDeath: "black", birthOnly:"url(#birthGradient)",deathOnly:"url(#deathGradient)"};

    // Create the tooltip container.
    const tooltip = svg.append("g");
    createBG(svg, XScale, margin);

    // Draw x-axis with labels every 20 years, the x-axis is on an independent svg
    //const xAxisSvg = d3.create("svg");
    const axis = d3.select("#axis-container")
    .append("svg")
    .style("position", "fixed")
    .attr("width", "100%")
    .attr("height", 40)
    .attr("transform", `translate(0,0)`);

    axis.append("g")
    .attr("transform", `translate(0,40)`)
    .call(d3.axisTop(XScale)
      .tickValues(d3.range(Math.floor(minYear / 20) * 20, maxYear, 20))
      .tickFormat(d3.format(".0f")) // Add this line to change the tick format
      .tickSizeOuter(0));
    // Create bars and labels
    const bars = svg.append("g")
      .attr("id", "timelines")
      .selectAll("g")
      .data(timelineData)
      .join("g");

    createBars(bars, yPos);
    addEvents(axis, svg, bars, timelineData, tooltip, yPos);
    createDots(svg, yPosMin, yPosMax);
    
    // Add text to points

    // add pan and zoom, disabled here

    /* const zoom = d3.zoom()
    //   .scaleExtent([0.5, 2])
    //   .on('zoom', zoomed);
    
    // function zoomed(e) {
    //   svg.attr("transform", e.transform);
    // } 
    // svg.call(zoom);
    */
}

function createBars(bars, yPos){
    bars.append("rect")
    .attr("id", d => d.ID) 
    .attr("x", d => XScale(d.Birth_year))
    .attr("width", d => XScale(d.Death_year) - XScale(d.Birth_year))
    .attr("y", (d, i) => YScale(yPos[d.ID]))
    .attr("height", BAR_HEIGHT)
    .attr("fill", d => barFillColors[d.Type]);

  // Create labels displaying only name
  bars.append("text")
    .text(d => d.Name_cn)
    .attr("x", d => XScale(d.Birth_year) + 4)
    .attr("y", (d, i) => YScale(yPos[d.ID]) + BAR_HEIGHT / 2)
    .attr("alignment-baseline", "central")
    .attr("font-size", 1.2*BAR_HEIGHT)
    .attr("fill", "white")
    .attr("white-space", "nowrap")
    // .attr("overflow", "hidden")
    .attr("text-overflow", "ellipsis");
}


/*  --- Add events for timelines,
    --- Three events included: mouseover, mouseout, click
*/

function addEvents(axisSvg, svg, bars, timelineData, tooltip, yPos){
  // Mouseover and mouseout events for scrolling labels and showing dates on the timeline
  bars.on("mouseover", function (event, d) { 
    

    const bar = d3.select(this).select("rect");
    bar.attr("stroke", "white")
     .attr("stroke-width", 2);
    tooltip.style("display", null);
    tooltip.attr("transform", `translate(${XScale(d.Birth_year)}, ${YScale(yPos[d.ID]) + BAR_HEIGHT})`);

    const path = tooltip.selectAll("path")
      .data([,])
      .join("path")
        .attr("fill", "white")
        .attr("stroke", "black");
    const text = tooltip.selectAll("text")
    .data([,])  // Assuming lines are separated by '。'
    .join("text")
    .call(text => text
        .selectAll("tspan")
        .data((d.Name_cn+', 字'+ d.Zi +'。'+d.Note).split('。'))
        .join("tspan")
      .attr("x", 0)
      .attr("y", (_, i) => `${i * 1.1}em`)
      .attr("font-weight", (_, i) => i ? null : "bold")
      .text(d => d)
    );
    
    const {x, y, width: w, height: h} = text.node().getBBox();
    text.attr("transform", `translate(${-w / 2},${15 - y})`);
    path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
    tooltip.node().parentNode.appendChild(tooltip.node());
    // Show vertical lines and dates along the timeline
    const lineGroup = svg.append("g")
      .attr("class", "timeline-hover");
    const textGroup = axisSvg.append("g")
      .attr("class", "timeline-hover");  

    lineGroup.append("line")
      .attr("x1", XScale(d.Birth_year))
      .attr("x2", XScale(d.Birth_year))
      .attr("y1", YScale(yPos[d.ID]) + BAR_HEIGHT) // Start from the bottom of the bar
      .attr("y2", 0)
      .style("stroke", "rgba(225,0,0,0.3)");

    lineGroup.append("line")
      .attr("x1", XScale(d.Death_year))
      .attr("x2", XScale(d.Death_year))
      .attr("y1", YScale(yPos[d.ID]) + BAR_HEIGHT) // Start from the bottom of the bar
      .attr("y2", 0)
      .style("stroke", "rgba(225,0,0,0.3)");

    textGroup.append("text")
      .text(d.Birth_year)
      .attr("x", XScale(d.Birth_year))
      .attr("y", 0 + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "red"); // Display birth date in red

    textGroup.append("text")
      .text(d.Death_year)
      .attr("x", XScale(d.Death_year))
      .attr("y", 0 + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "red"); // Display death date in red

  })

  .on("mouseout", function (event, d) {
      // Hide vertical lines and dates along the timeline
      svg.selectAll(".timeline-hover").remove();
      axisSvg.selectAll(".timeline-hover").remove();

      const bar = d3.select(this).select("rect");
      const name = d3.select(this).select("text");
      // Set the bar color back to the original 
      bar.attr("fill", barFillColors[d.Type]);
      name.attr("fill", "white");
      // Remove stroke
      bar.attr("stroke", null); // or rect.attr("stroke", "");

      // Hide tip
      tooltip.style("display", "none");
    })

  .on("click", function (event, d) {

    
    const bar = d3.select(this).select("rect");
    const name = d3.select(this).select("text");

    // --- highlight selected bars
    bar.attr("fill", "#969696");
    name.attr("fill", "#black");
    // bar.style("opacity", 0);

    
    // bar.attr("stroke", "blue")
    // .attr("stroke-width", 2);
    if (FamilytreeRoots.hasOwnProperty(d.ID))
    {    
        root = FamilytreeRoots[d.ID];

        var highlightPos = [parseFloat(bar.attr("x")) + parseFloat(bar.attr("width"))/2, parseFloat(bar.attr("y")) + parseFloat(bar.attr("height"))/2];
        Familytree(svg, AllData, root, d.ID, highlightPos);
    }
  })
}


function createDots(svg, yPosMin, yPosMax){
    // Create dots for individuals whose birth*death year are unknown
    if (!Filters.includes(DATA_TYPE4))
    {    
      const points = svg.append("g")
      .selectAll("g")
      .data(AllData.filter(d => d.Type === "noBirthOrDeath"))
      .join("g");
      
      points.append("circle")
        .attr("id", d => d.ID) 
        .attr("cx", d => XScale(d.Live_year))
        .attr("cy", d => YScale(getRandomInt(yPosMin, yPosMax)))
        .attr("r", 5)
        .attr("fill", "grey");
    }
}

function computeBarYPosition(data, direction = "center") {
      function xOverlaps(a, b) {
        return a.Birth_year < b.Death_year + 1 && a.Death_year + 1 > b.Birth_year;
      }
  
    const yPos = {};
    const lastBars = {};
  
    let minRow = 0;
    let maxRow = 0;
  
    data.sort((a, b) => a.Birth_year - b.Birth_year);
  
    data.forEach((d, i) => {
      if (i === 0) {
        yPos[d.ID] = 0;
        lastBars[0] = d;
        return;
      }
  
      let optimalRow;
      let minDeathYear = Infinity;
  
      for (const row of Object.keys(lastBars).map(Number)) {
        if (!xOverlaps(lastBars[row], d) && lastBars[row]?.Death_year < minDeathYear) {
          optimalRow = row;
          minDeathYear = lastBars[row]?.Death_year;
        }
      }
  
      if (optimalRow === undefined) {
        if (direction === "top") {
          optimalRow = maxRow + 1;
        } else if (direction === "bottom") {
          optimalRow = minRow - 1;
        } else {
          optimalRow = Math.abs(minRow - 1) < maxRow + 1 ? minRow - 1 : maxRow + 1;
        }
      }
  
      yPos[d.ID] = optimalRow;
      lastBars[optimalRow] = d;
  
      if (optimalRow < minRow) {
        minRow = optimalRow;
      }
      if (optimalRow > maxRow) {
        maxRow = optimalRow;
      }
    });
  
    return yPos;
}
  
  
function createBG(svg, XScale, margin){
    const bg = svg.append("g").attr("id", "background");//background
    // Draw vertical gridlines at every dynasty mark
    const linesLayer = svg.append("g").attr("class", "lines-layer");

      // Dynasty key years
    const dynastyKeyPoint = [25,220, 266, 316,420];
    const WuDuration = [229,280];
    const ShuDuration = [221,263];
    const hanBGColor = "#e7e1ef";
    const weiBGColor = "#fde0dd";
    const westJinBGColor = "#f7fcb9";
    const eastJinBGColor = "#edf8b1";
      bg.append("rect")
      .attr("x", XScale(dynastyKeyPoint[0]))
      .attr("width", XScale(dynastyKeyPoint[1])-XScale(dynastyKeyPoint[0]))
      .attr("y", 0)
      .attr("height", ChartHeight)
      .attr("fill", hanBGColor);
    bg.append("rect")
      .attr("x", XScale(dynastyKeyPoint[1]))
      .attr("width", XScale(dynastyKeyPoint[2])-XScale(dynastyKeyPoint[1]))
      .attr("y", 0)
      .attr("height", ChartHeight)
      .attr("fill", weiBGColor);
    bg.append("rect")
      .attr("x", XScale(dynastyKeyPoint[2]))
      .attr("width", XScale(dynastyKeyPoint[3])-XScale(dynastyKeyPoint[2]))
      .attr("y", 0)
      .attr("height", ChartHeight)
      .attr("fill", westJinBGColor);
      bg.append("rect")
      .attr("x", XScale(dynastyKeyPoint[3]))
      .attr("width", XScale(dynastyKeyPoint[4])-XScale(dynastyKeyPoint[3]))
      .attr("y", 0)
      .attr("height", ChartHeight)
      .attr("fill", eastJinBGColor);
  
      linesLayer.append("g")
      .selectAll("line")
      .data(dynastyKeyPoint)
      .join("line")
        .attr("x1", d => XScale(d))
        .attr("x2", d => XScale(d))
        .attr("y1", margin.bottom)
        .attr("y2", ChartHeight)
        .style("stroke", "rgba(0,0,1,1)");
}

function createGradient(svg)
{
        // Create the chart

    const birthGradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "birthGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

    birthGradient.append("stop")
        .attr("offset", "0%")
        .style("stop-color", "#e5f5f9");

    birthGradient.append("stop")
        .attr("offset", "100%")
        .style("stop-color", "#00441b");

    const deathGradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "deathGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

    deathGradient.append("stop")
        .attr("offset", "0%")
        .style("stop-color", "#00441b");

        deathGradient.append("stop")
        .attr("offset", "100%")
        .style("stop-color", "#e5f5f9");
}

function generateNormalDistribution(mean, stdDev, numPoints) {
    function gaussianRandom(mean, stdDev) {
        const u = 1 - Math.random(); // Converting [0,1) to (0,1]
        const v = Math.random();
        const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        // Transform to the desired mean and standard deviation:
        return z * stdDev + mean;
    }
    const data = [];

    for (let i = 0; i < numPoints; i++) {
        const randomValue = gaussianRandom(mean, stdDev);
        data.push(Math.floor(randomValue));
    }

    return data;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function updateTimelineData(value, dataType)
{
  console.log("##### updateTimelineData is called")
    // update timeline data by updating the Filters list
    if (value)
      Filters = Filters.filter(item => item !== dataType);
    else
      Filters.push(dataType);

    // update timeline
    Timeline(AllData, FamilytreeRoots)
}

function Familytree(svg, IndividualData, familyRoot, highlightPID, pos)
{
    

    var Treedx = 40;
    var Treedy = 100;
  //  root.dy = width / (root.height+1);
    const root = d3.tree().nodeSize([Treedx, Treedy])(familyRoot);


    let highlightPx, highlightPy;
    root.each(d => {
        if (d.data.value == highlightPID) {highlightPx = d.x; highlightPy = d.y;}
    });



    // const svg =  d3.select("#familytree-chart").attr("width", 500).attr("height", 500);
    svg.selectAll("#familytree").remove();
    svg.selectAll("#timelines").attr("opacity", 0.2);
    svg.selectAll("#background").attr("opacity", 0.2);
    const g = svg.append("g")
        .attr("id", "familytree") 
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("transform", `translate(${pos[0] - highlightPy},${pos[1] - highlightPx})`);
        
    const link = g.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555") //#555
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 2)
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));
    
    const nodes = g.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);
    
    // const mouseover = node => {
    //     let InID = node.data.value-1; 
    //     let words = IndividualData[InID]["Note"].split("。");
    //     //words.pop();
    //     let content = "";
    //     words.forEach(w => {
    //     content += `<p  style="font-size: smaller;">${w}</p>`;
    //     });
    //     div
    //     .transition()
    //     .duration(200)
    //     .style("opacity", 0.9);
    //     div
    //     .html(content)
    //     .style("left", d3.event.pageX + "px")
    //     .style("top", d3.event.pageY + "px")
    //     .style("transform", "translate(0, -60%)");
    // };
    // const mouseout = node => {
    //     div
    //         .transition()
    //         .duration(200)
    //         .style("opacity", 0);
    // };

    nodes.append("circle")
        .attr("fill", d => d.data.value == highlightPID? "#fc4e2a" : "#black")
        .attr("r", 4)
    
    nodes.append("text")
        .attr("dy", "0.61em")
        .attr("fill",  d => d.data.value == highlightPID? "#fc4e2a" : "#black")
        .attr("x", d => d.children ? -6 : 6)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => IndividualData[d.data.value-1]["Name_cn"])
        .clone(true).lower();

    nodes.on("click", function (event, d) {
      const nodeID =  d.data.value;
      svg.selectAll("#familytree").remove();
      svg.selectAll("#timelines").attr("opacity", 1);
      svg.selectAll("#background").attr("opacity", 1);

      const bar = svg.selectAll("#timelines").select("rect[id='" + nodeID + "']"); // need add points operation
      bar.attr("fill", "red");
      const x = bar.attr("x");
      const y = bar.attr("y");
      console.log("#####x,y", bar.attr("x"), bar.attr("y"));
      svg.transition().duration(750).call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(x, y).scale(1)
      );
    });
}


function scrollToBottom() {
  const svgElement = document.querySelector('svg');
  const height = svgElement.getBoundingClientRect().height;
  window.scrollTo(0, height);
}
