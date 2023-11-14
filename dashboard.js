timelineDataFilters = {birthData:true, deathData:true, birthAndDeathData:true, noneData:true}

function updateTimelineData(value, dataFilter)
{
    timelineDataFilters[dataFilter] = value;
    generateTimeline(timelineDataFilters);
}