var liefspan_data_none = [];
var liefspan_data_birth = [];
var liefspan_data_death = [];
var liefspan_data_both = [];
var lifespan_data_list = [];
var timeline_data_all = [];

Key_years_range = {"EastHan":[184, 220], "Wei":[220, 266], "Shu":[221, 263],"Wu":[222, 280], "Jin":[266, 316],"EastJin":[317, 420]}
const END_HAN = moment("220"); // The end year of Han dynasty
const END_WEI = moment("266"); // The end year of Wei dynasty
const END_XIJIN = moment("316"); // The end year of west Jin dynasty
const END_DONGJIN = moment("420");
const START_SHU = moment("221");
const END_SHU = moment("263");
const START_WU = moment("222");
const END_WU = moment("280");
const YELLOW_TURBAN_REBELLION = moment("184"); 
const GAOPINGLING_INCIDENT = moment("249");
const BATTLE_REDCLIFFS = moment("208");
const BATTLE_XIAOTING = moment("221");

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
    }

  // Function to calculate the mean
function calculateMean(arr) {
    const sum = arr.reduce((acc, value) => acc + value, 0);
    return sum / arr.length;
}
// Function to calculate the median
function calculateMedian(arr) {
    const sortedArr = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sortedArr.length / 2);
    return sortedArr.length % 2 !== 0 ? sortedArr[mid] : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
}

// Function to calculate the standard deviation
function calculateStandardDeviation(arr) {
    const mean = calculateMean(arr);
    const squaredDifferences = arr.map(value => Math.pow(value - mean, 2));
    const meanSquaredDifferences = calculateMean(squaredDifferences);
    return Math.sqrt(meanSquaredDifferences);
}

function generateNormalDistribution(mean, stdDev, numPoints) {
    const data = [];

    for (let i = 0; i < numPoints; i++) {
        const randomValue = gaussianRandom(mean, stdDev);
        data.push(Math.floor(randomValue));
    }

    return data;
}

// Function to generate random numbers with a normal distribution, using  Box-Muller transform 
function gaussianRandom(mean, stdDev) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdDev + mean;
}

function initializeTimelineData(timelineDataFilters)
{
    fetch('sanguoListJson.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(element => {
            birthYear = element[7];
            deathYear = element[8];
            if((birthYear== "" && deathYear== "" ))
                {
                    era = element[6]; // the "affliation"
                    start = getRandomInt(Key_years_range[era][0], Key_years_range[era][1]).toString();
                    liefspan_data_none.push({id: element[1], type: "point", content: element[0], start: moment(start),  title: element[15]});
                }
            else if(birthYear!= "" && deathYear!= "" )
                {
                    liefspan_data_both.push({id: element[1], type:"range", content: element[0], start: moment(birthYear), end: moment(deathYear), title: element[15], className: "certainlifespan" });
                    lifespan_data_list.push(Number(element[9]));
                }
            else if(birthYear!= "" )
                liefspan_data_birth.push({id: element[1], type: "range", content: element[0], birth: Number(birthYear), start: moment(birthYear), title: element[15], className: "deathuncertain" });
            else if(deathYear!= "" )
                liefspan_data_death.push({id: element[1], type: "range", content: element[0],  death: Number(deathYear), end: moment(deathYear), title: element[15], className: "birthuncertain" });
            });

        var mean = calculateMean(lifespan_data_list);
        var std = calculateStandardDeviation(lifespan_data_list);
        var number_imcomplete_lifespan = liefspan_data_birth.length + liefspan_data_death.length;

        // // TEST
        // console.log("#### mean: ", mean);
        // console.log("#### std: ", std);
        // console.log("#### number_imcomplete_lifespan: ", number_imcomplete_lifespan);

        var simulated_lifespan = generateNormalDistribution(mean, std, number_imcomplete_lifespan);
        
        var i = 0;
        for (j =0; j < liefspan_data_birth.length;j++)
          {
            liefspan_data_birth[j].end = moment((liefspan_data_birth[j].birth + simulated_lifespan[i]).toString());
            i++;
          }
        
        for (j =0; j < liefspan_data_death.length;j++)
        {
          liefspan_data_death[j].start = moment((liefspan_data_death[j].death - simulated_lifespan[i]).toString());
          i++;
        }
        timeline_data_all = [...liefspan_data_none, ...liefspan_data_birth, ...liefspan_data_death, ...liefspan_data_both];
        generateTimeline(timelineDataFilters);
    });
}


function generateTimeline(timelineDataFilters)
{
    var data = [];
    
    // console.log("###", data);
    if(timelineDataFilters.birthAndDeathData)
        data = data.concat(liefspan_data_both);
    if(timelineDataFilters.birthData)
        data = data.concat(liefspan_data_birth);
    if(timelineDataFilters.deathData)
        data = data.concat(liefspan_data_death);
    if(timelineDataFilters.noneData)
        data = data.concat(liefspan_data_none);
    
    var items = new vis.DataSet(data);
    // Configuration for the Timeline
    var options = {
        verticalScroll: true,
        horizontalScroll: true,
        zoomKey: 'ctrlKey',
        margin: {
        item: {
            vertical: 5 // Adjust the vertical distance between bars (in pixels)
            }
        }
    };

    // Create a Timeline
    var container = document.getElementById('visualization');
    var timeline = new vis.Timeline(container, items, options);
    // Adjust the title size
    // var customStyles = document.createElement('style');
    // customStyles.innerHTML = '.vis-item-content {  top: -40%; transform: translateY(-40%); font-size: 10px; }'; // Set the desired font size
    // document.head.appendChild(customStyles);
    // Add the mark year
    timeline.addCustomTime(END_HAN, 'HAN');
    timeline.addCustomTime(END_WEI, 'WEI');
    timeline.addCustomTime(END_XIJIN, 'JIN');
    // Style the custom time line
    var customTimeMarker = document.querySelector('HAN');
    if (customTimeMarker) {
        customTimeMarker.style.background = '#9f3073'; // Set the background color
        customTimeMarker.style.width = '2px'; // Set the width of the line
    }
}