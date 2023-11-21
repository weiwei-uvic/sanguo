 function createFamilytree (posX, poxY, dotFormatString){
    // Create a new Vis.js network using the DOT file content
    var container = document.getElementById('familytree');
    var parsedData = vis.network.convertDot(dotContent);

    // Extract unique node IDs from edges
    var uniqueNodeIds = {};
    parsedData.edges.forEach(function (edge) {
        uniqueNodeIds[edge.from] = true;
        uniqueNodeIds[edge.to] = true;
    });

    // Create nodes and edges only for the connected nodes
    var connectedNodes = parsedData.nodes.filter(function (node) {
        return uniqueNodeIds[node.id];
    });

    var network = new vis.Network(container, { nodes: connectedNodes, edges: parsedData.edges }, {});

    // Optional: Customize the appearance of the network
    network.setOptions({
        nodes: {
            shape: 'box',
        },
        // edges: {
        //     arrows: 'to',
        // },
        layout: {
            hierarchical: {
            direction: "UD", //updown
            sortMethod: "directed"
            },
        },
    });
}
