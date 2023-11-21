timelineDataFilters = {birthData:true, deathData:true, birthAndDeathData:true, noneData:true}

function updateTimelineData(value, dataType)
{
    if (value)
        addGroups(dataType);
    else
        removeGroups(dataType);
}