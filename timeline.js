var timeline_data_dict = {birthData:[], deathData:[], birthAndDeathData:[], noneData:[]}; // the list of all timeline data
var timeline_data_list; // the list of all timeline data

var lifespan_data_ids;  // caches all individuals ids.
var Timeline;  // THE timeline (visualization generated from vis.js)
var TimelineItems;
var FamilytreeData;

var MouseX;
var MouseY;

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

//return value: {lifespan_data_ids, timeline_data_list}
function initializeTimelineData()
{
    return new Promise((resolve, reject) => {
        if (timeline_data_list) 
            resolve({lifespan_data_ids, timeline_data_list});
        else
        {
            var liefspan_data_none = [];
            var liefspan_data_birth = [];
            var liefspan_data_death = [];
            var liefspan_data_both = [];

            var lifespan_data_list = []; // lifespan data, for distribution simulation
            fetch('sanguoListJson.json')
            .then(response => response.json())
            .then(data => {
                timeline_data_list = [];
                lifespan_data_ids = {birthData:[], deathData:[], birthAndDeathData:[], noneData:[]};

                data.forEach(element => {
                    birthYear = element[7];
                    deathYear = element[8];
                    personid = Number(element[1]);
                    if((birthYear== "" && deathYear== "" ))
                    {
                        lifespan_data_ids.noneData.push(personid);
                        era = element[6]; // the "affliation"
                        start = getRandomInt(Key_years_range[era][0], Key_years_range[era][1]).toString();
                        liefspan_data_none.push({id: personid, type: "point", content: element[0], start: moment(start),  title: element[15]});
                    }
                    else if(birthYear!= "" && deathYear!= "" )
                    {
                        lifespan_data_ids.birthAndDeathData.push(personid);
                        liefspan_data_both.push({id: personid, type:"range", content: element[0], start: moment(birthYear), end: moment(deathYear), title: element[15], className: "certainlifespan" });
                        lifespan_data_list.push(Number(element[9]));
                    }
                    else if(birthYear!= "" )
                    {
                        lifespan_data_ids.birthData.push(personid);
                        liefspan_data_birth.push({id: personid, type: "range", content: element[0], birth: Number(birthYear), start: moment(birthYear), title: element[15], className: "deathuncertain" });
                        
                    }
                    else if(deathYear!= "" )
                    {
                        lifespan_data_ids.deathData.push(personid);
                        liefspan_data_death.push({id: personid, type: "range", content: element[0],  death: Number(deathYear), end: moment(deathYear), title: element[15], className: "birthuncertain" });
                    }
                    });
                // Processing uncertain data 
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
                timeline_data_list = [...liefspan_data_none, ...liefspan_data_birth, ...liefspan_data_death, ...liefspan_data_both];
                timeline_data_dict.noneData = liefspan_data_none;
                timeline_data_dict.birthData = liefspan_data_birth;
                timeline_data_dict.deathData = liefspan_data_death;
                timeline_data_dict.birthAndDeathData = liefspan_data_both;
                resolve ({lifespan_data_ids, timeline_data_list});
            });
        }
    })
}

function generateDotString(data) {
    let dotString = "";

    function generateDotRecursive(currentNode) {
        const currentId = currentNode.id.toString();

        for (const child of currentNode.children) {
            const childId = child.id.toString();
            dotString += `"${currentId}" -> "${childId}" [label="${child.value}"];\n`;
            generateDotRecursive(child);
        }
    }

    // Start the recursive generation
    dotString += "digraph MyGraph {\n";
    generateDotRecursive(data);
    dotString += "}\n";

    return dotString;
}

function generateDotString()
{

}


function addClickEvent(timeline)
{
    // Add a click event listener to the timeline
    timeline.on('click', function (properties) {
        if (properties.item) {
            // 'properties.item' contains the ID of the clicked item
            var itemId = properties.item;

            // Use the getItemRange method to get the start and end dates of the clicked item
            var itemRange = timeline.getItemRange(itemId);

            // 'properties.event.clientX' and 'properties.event.clientY' contain the mouse click coordinates
            var mouseX = properties.event.clientX;
            var mouseY = properties.event.clientY;

            const dotString = generateDotString(jsonData);
            // Use $.ajax to retrieve data for the new network
            $.ajax({
                url: 'familytree.dot', // Replace with your actual endpoint
                dataType: 'text',
                success: function (networkData) {
                    // Create a new Vis.js network at the mouse position with the retrieved data
                    createNetwork(itemRange.start, mouseX, mouseY, networkData);
                },
                error: function (error) {
                    console.error('Error retrieving network data:', error);
                }
            });
        }
    });
}

function timeline()
{
    
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
    var timelineContainer = document.getElementById('visualization');
    timelineContainer.innerHTML = "";
    Timeline = new vis.Timeline(timelineContainer, TimelineItems, options);
    // Adjust the title size
    // var customStyles = document.createElement('style');
    // customStyles.innerHTML = '.vis-item-content {  top: -40%; transform: translateY(-40%); font-size: 10px; }'; // Set the desired font size
    // document.head.appendChild(customStyles);
    // Add the mark year
    Timeline.addCustomTime(END_HAN, 'HAN');
    Timeline.customTimes[Timeline.customTimes.length - 1].hammer.off("panstart panmove panend");
    Timeline.addCustomTime(END_WEI, 'WEI');
    Timeline.customTimes[Timeline.customTimes.length - 1].hammer.off("panstart panmove panend");
    Timeline.addCustomTime(END_XIJIN, 'JIN');
    //disable the movement of custom time
    Timeline.customTimes[Timeline.customTimes.length - 1].hammer.off("panstart panmove panend");
    // Style the custom time line
    var customTimeMarker = document.querySelector('HAN');
    if (customTimeMarker) {
        customTimeMarker.style.background = '#9f3073'; // Set the background color
        customTimeMarker.style.width = '2px'; // Set the width of the line
    }
    console.log("###### timeline created");
    return Timeline;
}

function generateTimeline()
{
    return new Promise((resolve, reject) => {
        if (Timeline) 
            resolve(Timeline);
        else
            initializeTimelineData()
            .then(response =>
                {
                    TimelineItems = new vis.DataSet(response.timeline_data_list);
                    resolve(timeline());
                });
    });
}


/**
 * Remove groups(with/without birth/death info) from current timeline, based on 
 */
function removeGroups(dataType)
{
    initializeTimelineData()
    .then(timelineData =>{
        generateTimeline()
        .then(Timeline => {
            var ids = timelineData.lifespan_data_ids;
            TimelineItems.remove(ids[dataType]);
            Timeline.destroy();
            timeline();
        });
    });
}


/**
 * Add new items to current timeline
 */
function addGroups(dataType)
{
    initializeTimelineData()
    .then(timelineData =>{
        generateTimeline()
        .then(Timeline => {
            TimelineItems.add(timeline_data_dict[dataType]);
            Timeline.destroy();
            timeline();
        });
    });
}