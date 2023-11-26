const BAR_HEIGHT = 10;
const TREE_DX = 60; // the minimum distance between the left and right child nodes of a parent node.
const TREE_DY = 100; //the minimum distance between the parent node and its child nodes
// Chart dimensions and configuration
const MARGIN = ({ top: 10, right: 20, bottom: 50, left: 20 }); 

const DATA_TYPE1 = "birthAndDeath";
const DATA_TYPE2 = "birthOnly";
const DATA_TYPE3 = "deathOnly";
const DATA_TYPE4 = "noBirthOrDeath";
const TEXT_COLOR = "#000";
const BAR_LIGHT_COLOR = "#fff7fb";
const BAR_SOLID_COLOR = "#4292c6";
const BAR_SOLID_COLOR_F = "#807dba";
const HIGHTLIGHT_COLOR = "#e31a1c";
const DOT_SOLID_COLOR = "#808080"; // grey
const DOT_OPACITY = 0.5; // Set the opacity of dots to translucent
const DOT_RADIUS = 10; // the radius of dot: 10px

var barFillColors = {};

var ChartHeight;
var XScale;
var YScale;
var FamilytreeRoots = {};
var AllData;

/* Filters determine which type of individuals will be hiden. 
* Default not showing individuals without known birth nor death info
*/

var ShownIndividualNum = 1722; // --- The totoal number of individuals shown on screen
var PointsDdata; // the data that doesn't have birth and death year info
var Width; // the width of the main svg

var TypeFilter = [];
var GenderFilter = [];

var HighlightIDs = []; // --- Stores all individual ids that highlighted. Id will be added when individuals are clicked, and removed when BG is clicked

function Timeline(data, familytreeDicts) {
  console.log("###### Timeline is called", data.length);

  AllData = data;
  FamilytreeRoots = familytreeDicts;

  // --- Filter data by type, gender
  PointsDdata =  AllData.filter(d => d.Type == DATA_TYPE4);
  const timelineData = AllData.filter(d => d.Type != DATA_TYPE4);

  const Width = window.innerWidth;
  // Calculate max of the death year and min of the birth year
  const maxYear = Math.max(...timelineData.map(d => d.Death_year)) + 20;
  const minYear = Math.min(...timelineData.map(d => d.Birth_year)) - 20;
  // Compute the y position for each bar
  const yPos = computeBarYPosition(timelineData, "bottom");

  // Calculate the maximum yPos value and the height of the chart
  const yPosMax = yPos[Object.keys(yPos).reduce((a, b) => yPos[a] > yPos[b] ? a : b)];
  const yPosMin = yPos[Object.keys(yPos).reduce((a, b) => yPos[a] < yPos[b] ? a : b)];

  ChartHeight = (yPosMax - yPosMin) * BAR_HEIGHT * 2;
  const height = ChartHeight + MARGIN.top + MARGIN.bottom;

  // Create X and Y scales
  XScale = d3.scaleLinear().domain([minYear, maxYear]).range([MARGIN.left, Width - MARGIN.right]);
  YScale = d3.scalePoint().domain(d3.range(yPosMin, yPosMax + 1)).range([height - MARGIN.bottom, MARGIN.top]).padding(1.5);
  

  // --- clear svgs
  d3.select("#chart-container").selectAll('svg').remove();
  d3.select("#axis-container").selectAll('svg').remove();
  const svg = d3.select("#chart-container")//(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
  .append("svg")
  .attr("width", Width)
  .attr("height", height)
  .style('bottom', '0')
  // Bar fill color
  createGradient(svg);
  barFillColors = {birthAndDeath: BAR_SOLID_COLOR, birthOnly:"url(#birthGradient)",deathOnly:"url(#deathGradient)"};

  // Create the tooltip container.
  const tooltip = svg.append("g");
  

  // Draw x-axis with labels every 20 years, the x-axis is on an independent svg
  //const xAxisSvg = d3.create("svg");
  const axis = d3.select("#axis-container")
  .append("svg")
  .attr("width", "100%")
  .attr("height", 30)
  .attr("transform", `translate(0,0)`);

  axis.append("g")
  .attr("transform", `translate(0,30)`)
  .call(d3.axisTop(XScale)
    .tickValues(d3.range(Math.floor(minYear / 20) * 20, maxYear, 20))
    .tickFormat(d3.format(".0f")) // Add this line to change the tick format
    .tickSizeOuter(0));

  createBG(svg, XScale);
  // Create bars and labels
  const bars = svg.append("g")
    .attr("class", "timelines")
    .selectAll("g")
    .data(timelineData)
    .join("g");

  createBars(bars, yPos);
  addEvents(axis, svg, bars, tooltip, yPos);
  //if (!Filters.includes(DATA_TYPE4))
  createDots(svg, yPosMin, yPosMax, tooltip);
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
    .attr("y", 50) // Initial y-coordinate (adjust as needed)
    .attr("fill", d => barFillColors[d.Type])
    .transition()
    .duration(3000)  
    .attr("x", d => XScale(d.Birth_year))
    .attr("width", d => XScale(d.Death_year) - XScale(d.Birth_year))
    .attr("y", d => YScale(yPos[d.ID]))
    .attr("height", BAR_HEIGHT);

  // Create labels displaying only name
  bars.append("text")
    .text(d => d.Name_cn)
    .attr("x", d => XScale(d.Birth_year) + (XScale(d.Death_year) - XScale(d.Birth_year))/2)
    .attr("y", d => YScale(yPos[d.ID]) + BAR_HEIGHT / 2)
    .attr("alignment-baseline", "central")
    .attr("font-size", 1.2*BAR_HEIGHT)
    .attr("fill", TEXT_COLOR)
    .attr("white-space", "nowrap")
    // .attr("overflow", "hidden")
    .attr("text-overflow", "ellipsis");
}


/*  --- Add events for timelines,
    --- Three events included: mouseover, mouseout, click
*/

function addEvents(axisSvg, svg, bars, tooltip, yPos){
  // Mouseover and mouseout events for scrolling labels and showing dates on the timeline
  bars.on("mouseover", function (event, d) { 
    const bar = d3.select(this).select("rect");
    bar.attr("fill", barFillColors[d.Type]);
    bar.attr("stroke", HIGHTLIGHT_COLOR)
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
        .data((d.Name_cn + '(' + d.Name_en + '), 字'+ d.Zi +'。'+d.Note).split('。'))
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
      .attr("y1", YScale(yPos[d.ID]) + BAR_HEIGHT) // Start from the top of the bar
      .attr("y2", 0)
      .attr('stroke-dasharray', d.Type === DATA_TYPE3 ? '5,5' : 'none')
      .style("stroke", "red");

    lineGroup.append("line")
      .attr("x1", XScale(d.Death_year))
      .attr("x2", XScale(d.Death_year))
      .attr("y1", YScale(yPos[d.ID]) + BAR_HEIGHT) // Start from the top of the bar
      .attr("y2", 0)
      .attr('stroke-dasharray', d.Type === DATA_TYPE2 ? '5,5' : 'none')
      .style("stroke", "red");

    textGroup.append("text")
      .text(d.Birth_year)
      .attr("x", XScale(d.Birth_year))
      .attr("y", 11)
      .attr("text-anchor", "middle")
      .attr("fill", "red"); // Display birth date in red

    textGroup.append("text")
      .text(d.Death_year)
      .attr("x", XScale(d.Death_year))
      .attr("y", 11)
      .attr("text-anchor", "middle")
      .attr("fill", "red"); // Display death date in red

  })

  .on("mouseout", function (event, d) {
      // Hide vertical lines and dates along the timeline
      svg.selectAll(".timeline-hover").remove();
      axisSvg.selectAll(".timeline-hover").remove();

      const bar = d3.select(this).select("rect");
      // Set the bar color back to the original 
      //name.attr("fill", "white");
      // Remove stroke
      bar.attr("stroke", null); // or rect.attr("stroke", "");

      // Hide tip
      tooltip.style("display", "none");
    })

  .on("click", function (event, d) {

    
    const bar = d3.select(this).select("rect");
    const name = d3.select(this).select("text");

    // --- highlight selected bars
    HighlightIDs.push(d.ID);
    bar.attr("fill", HIGHTLIGHT_COLOR);
    name.attr("fill", TEXT_COLOR);
    // bar.style("opacity", 0);

    
    // bar.attr("stroke", "blue")
    // .attr("stroke-width", 2);
    if (FamilytreeRoots.hasOwnProperty(d.ID))
    {  
      //Make timeline uninteractionable  
      svg.selectAll(".timelines")
      .style('pointer-events', 'none');
      root = FamilytreeRoots[d.ID];
      var highlightPos = [parseFloat(bar.attr("x")) + parseFloat(bar.attr("width"))/2, parseFloat(bar.attr("y")) + parseFloat(bar.attr("height"))/2];
      Familytree(svg, AllData, root, d.ID, highlightPos);
    }
  })
}


function createDots(svg, yPosMin, yPosMax, tooltip){
    // Create dots for individuals whose birth*death year are unknown
    const points = svg.append("g")
    .attr("class", "timelines")
    .selectAll("g")
    .data(PointsDdata)
    .join("g");

    var randomYpos = [];
    for(i =0, s = PointsDdata.length; i< s; i++)
    randomYpos.push(getRandomInt(yPosMin, yPosMax));
    points.append("circle")
      .attr("id", d => d.ID) 
      .attr("cx", 50) // Initial x-coordinate (adjust as needed)
      .attr("cy", 50) // Initial y-coordinate (adjust as needed)
      .attr("r", 0)
      .attr("fill-opacity", DOT_OPACITY)
      .attr("fill", DOT_SOLID_COLOR)
      .transition()
      .duration(3000) 
      .attr("cx", d => XScale(d.Live_year))
      .attr("cy", (d,i) => YScale(randomYpos[i]))
      .attr("r", DOT_RADIUS)

    points.on("mouseover", function (event, d) {
      const point = d3.select(this).select("circle"); 
      
      const cx = point.attr("cx");
      const cy = point.attr("cy");


      point.attr("stroke", HIGHTLIGHT_COLOR)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 1); 

      tooltip.style("display", null);
      tooltip.attr("transform", `translate(${cx}, ${cy+DOT_RADIUS/2})`);

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
          .data((d.Name_cn + '(' + d.Name_en + '), 字'+ d.Zi +'。'+d.Note).split('。'))
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
      // const textGroupPoints = svg.append("g")
      // .attr("class", "timeline-hover");  
      // textGroupPoints.append("text")
      // .text(d.Name_cn)
      // .attr("x", point.attr("cx"))
      // .attr("y", point.attr("cy")-5)
      // .attr("text-anchor", "middle")
      // .attr("fill", "red"); 
    })

    .on("mouseout", function () {
      const point = d3.select(this).select("circle"); 
      point.attr("stroke", "null").attr("fill-opacity", DOT_OPACITY);
      // Hide tip
      tooltip.style("display", "none");
      svg.selectAll(".timeline-hover").remove();
    })

    .on("click", function (event, d) {
  
      const point = d3.select(this).select("circle");
  
      // --- highlight selected bars
      point.attr("fill", HIGHTLIGHT_COLOR)
      .attr("fill-opacity", 1);

      HighlightIDs.push(d.ID);

      if (FamilytreeRoots.hasOwnProperty(d.ID))
      {  
        //Make timeline uninteractionable  
        svg.selectAll(".timelines")
        .style('pointer-events', 'none');
        root = FamilytreeRoots[d.ID];
        var highlightPos = [parseFloat(point.attr("cx")), parseFloat(point.attr("cy"))];
        Familytree(svg, AllData, root, d.ID, highlightPos);
      }
    })
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
  
  
function createBG(svg, XScale){
    const bg = svg.append("g").attr("id", "background");//background
    // Draw vertical gridlines at every dynasty mark
    const linesLayer = svg.append("g").attr("class", "lines-layer");
    // the container of background
    bg.append("rect")
      .attr("x", XScale(0))
      .attr("width", XScale(460))
      .attr("y", 0)
      .attr("height", ChartHeight)
      .attr("fill", "white");
      // Dynasty key years
    const dynastyKeyPoint = [25,220, 266, 316,420];
    // const WuDuration = [229,280];
    // const ShuDuration = [221,263];
    // const hanBGColor = "#e7e1ef";
    // const weiBGColor = "#fde0dd";
    // const westJinBGColor = "#f7fcb9";
    // const eastJinBGColor = "#edf8b1";
      linesLayer.append("g")
      .selectAll("line")
      .data(dynastyKeyPoint)
      .join("line")
        .attr("x1", d => XScale(d))
        .attr("x2", d => XScale(d))
        .attr("y1", 0)
        .attr("y2", ChartHeight)
        .style("stroke", TEXT_COLOR);
    svg.select("#background").on('click', function (event, d){resetTimeline(svg);});
}

function createGradient(svg)
{
    const birthGradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "birthGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

    birthGradient.append("stop")
        .attr("offset", "0%")
        .style("stop-color", BAR_SOLID_COLOR);

    birthGradient.append("stop")
        .attr("offset", "100%")
        .style("stop-color", "#fff7fb");

    const deathGradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "deathGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

    deathGradient.append("stop")
        .attr("offset", "0%")
        .style("stop-color", "#fff7fb");

        deathGradient.append("stop")
        .attr("offset", "100%")
        .style("stop-color", BAR_SOLID_COLOR);
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

function handleFilter(){

}

function updateTimeline(value, filter)
{
    if(filter === "F" ||filter === "M" )
      if(!value)
        GenderFilter.push(filter);
      else
        GenderFilter.splice(GenderFilter.indexOf(filter),1);
    else
      if(!value)
        TypeFilter.push(filter);
      else
        TypeFilter.splice(TypeFilter.indexOf(filter),1);

    d3.selectAll(".timelines").selectAll("*").filter(d => GenderFilter.includes(d.Gender) || TypeFilter.includes(d.Type))
      .selectAll("*")
      .style("visibility", "hidden")
      .style('pointer-events', "none");

    d3.selectAll(".timelines").selectAll("*").filter(d => !GenderFilter.includes(d.Gender) && !TypeFilter.includes(d.Type))
      .selectAll("*")
      .style("visibility", "visible")
      .style('pointer-events', "auto");

    var count =0;
    d3.selectAll(".timelines").selectAll("rect").filter(function () {
      count += d3.select(this).style("visibility") === "visible"? 1:0;
        return false;
    });
    d3.selectAll(".timelines").selectAll("circle").filter(function () {
      count += d3.select(this).style("visibility") === "visible"? 1:0;
        return false;
    });
    
    document.getElementById("num_Shown").innerHTML = '' + count;
    
}

function Familytree(svg, IndividualData, familyRoot, highlightPID, pos)
{
    //  root.dy = width / (root.height+1);
    const root = d3.tree().nodeSize([TREE_DX, TREE_DY])(familyRoot);
    
    let highlightPx, highlightPy;
    root.each(d => {
        if (d.data.value == highlightPID) {highlightPx = d.x; highlightPy = d.y;}
    });
    // --- Clear screen
    svg.selectAll("#familytree").remove();
    svg.selectAll(".timelines").attr("opacity", 0.2);
    svg.selectAll("#background").attr("opacity", 0.2);

    const g = svg.append("g")
        .attr("id", "familytree") 
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("transform", `translate(${pos[0] - highlightPy},${pos[1] - highlightPx})`);
        
    const link = g.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
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
        
    nodes.append("circle")
        .attr("fill", d => d.data.value == highlightPID? "#fc4e2a" : TEXT_COLOR)
        .attr("r", 4)
        .attr("class", "node");
    
    nodes.append("text")
        .attr("dy", "0.61em")
        .attr("fill",  d => d.data.value == highlightPID? "#fc4e2a" : TEXT_COLOR)
        .attr("x", d => d.children ? -6 : 6)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => IndividualData[d.data.value-1]["Name_cn"])
        .style("font-size", "20px")
        .clone(true).lower();

    nodes.on('click', function (event, d) {
        resetTimeline(svg);
        const individual = svg.selectAll(".timelines").select("[id='" + d.data.value + "']"); // need add points operation
        var ypos = locateIndividual(individual);
        window.scrollTo(0,  ypos - window.innerHeight/2);
    });
    // nodes.on("click", function (event, d) {
    //   svg.selectAll(".timelines")
    //   .style('pointer-events', 'auto');
    //   svg.selectAll("#familytree").remove()
      
    //   const nodeID =  d.data.value;
    //   const individual = svg.selectAll(".timelines").select("[id='" + nodeID + "']"); // need add points operation
    //   individual.attr("stroke", HIGHTLIGHT_COLOR)
    //   .attr("stroke-width", 2);
    //   console.log("individual", individual);
    //   var ypos = individual.attr("y")||individual.attr("cy");
      
    //   svg.transition().duration(500)
    //     .selectAll("g").attr("opacity", 1);
      
    //   window.scrollTo(0,  ypos - window.innerHeight/2);
    // });
}

// --- the function is not called since the pan and zoom effect need to be improved
function scrollToBottom() {
  const svgElement = document.querySelector('svg');
  const height = svgElement.getBoundingClientRect().height;
  window.scrollTo(0, height);
}

function resetTimeline(svg) {
    svg.selectAll(".timelines")
        .style('pointer-events', 'auto');
    svg.selectAll("#familytree").remove();
    svg.transition().duration(500)
      .selectAll("g").attr("opacity", 1);
      HighlightIDs.forEach(function(ID)
      {
        highlightItem= svg.selectAll(".timelines").select("[id='" + ID + "']");
        if (AllData[ID-1].Type != DATA_TYPE4)
            highlightItem.attr("fill", barFillColors[AllData[ID-1].Type]);
        else
            highlightItem.attr("fill", DOT_SOLID_COLOR).attr("fill-opacity", DOT_OPACITY);
      
      });
}


/**
 * 
 * @param {The text input for searching} input 
 */
function searchIndividual(input){
    results = AllData.filter((d => d.Name_cn.includes(input) ||d.Name_en.includes(input)));
    if (results.length === 0)
        showNotice(1);
    else
    {
        svg = d3.select("#chart-container");
        var ypos;
        resetTimeline(svg);
        
        results.forEach(function(value)
        {
          const individual = svg.selectAll(".timelines").select("[id='" + value.ID + "']"); // need add points operation
          ypos = locateIndividual(individual);
        });
        window.scrollTo(0,  ypos - window.innerHeight/2);
    }
}


function locateIndividual(individual){
    individual.attr("stroke", HIGHTLIGHT_COLOR).attr("stroke-width", 2);
    ypos = individual.attr("y")||individual.attr("cy");
    if(individual.style("visibility") === "hidden")
        showNotice(0);
    return ypos;
}