//Define bar chart function
function barChart(dataset, name) {
//Set width and height as fixed variables
    "use strict";

    var w, h, padding, chartSelector, mm, yScale, yAxis, svg, aspect, chart;
    w = 800;
    h = 100;
    padding = 0;
    chartSelector = "#chart_" + name;
    mm = d3.extent(dataset.map(function (d) { return d; }));
    //Scale function for axes and radius

    yScale = d3.scale.linear().domain(mm).range([h, 0]);

    //Create y axis
    yAxis = d3.svg.axis().scale(yScale).orient("right").ticks(4);

    //Create svg element
    svg = d3.select(chartSelector).append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("id", chartSelector)
        .attr("viewBox", "0 0 " + w + " " + h)
        .attr("preserveAspectRatio", "xMinYMin");

    //Resizing function to maintain aspect ratio (uses jquery)
    aspect = w / h;
    chart = $(chartSelector);
    $(window).on("resize", function () {
        var targetWidth = $("body").width();
        if (targetWidth < w) {
            chart.attr("width", targetWidth);
            chart.attr("height", targetWidth / aspect);
        } else {
            chart.attr("width", w);
            chart.attr("height", w / aspect);
        }
    });
    //Create barchart
    svg.selectAll("rect")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class", function (d) {
            return d < 0 ? "negative" : "positive";
        })
        .attr({
            x: function (d, i) {
                return i * (w / dataset.length);
            },
            y: function (d) {
                return yScale(Math.max(0, d));
            },
            width: w / dataset.length - padding,
            height: function (d) {
                return Math.abs(yScale(d) - yScale(0));
            }
        });
    //Add y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    return mm;
}