$(document).ready(function() {

	// URL FOR READING IN THE DATA
	var url = "javascripts/global-temperature.json";
	
	// HELPER VARIABLES
	var formatYear = d3.format("d");
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var colors = ["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"];
	var bucketsLength = colors.length;

	// GET THE GDP JSON DATA, THEN BUILD THE BAR CHART TO VISUALIZE IT
	d3.json(url, function(error, jsonData) {
		
		// IF THERE WAS AN ERROR, STOP NOW AND SHOW AN ERROR MESSAGE
		if (error) { 
			$(".errorMessage").show();
			return error;
		}
		
		// CHECK WHAT DATA WE HAVE
		console.log(jsonData);
		var baseTemperature = jsonData.baseTemperature;
		var data = jsonData.monthlyVariance;
		console.log(data);

		// SET SOME STYLING VARIABLES FOR THE CHART
		var margin = {
			top: 5,
			right: 20,
			bottom: 50,
			left: 100
		};
		var width = 1000 - margin.left - margin.right;
		var height = 500 - margin.top - margin.bottom;
		var barWidth = Math.ceil(width / (2015-1753));
		var barHeight = Math.ceil(height / 12);

		// X SCALE
		// TAKE THE MIN AND THE MAX FINISH TIMES AND FIT IT TO THE WIDTH WE SET EARLIER
		// ALSO ADD A FEW SECONDS OF PADDING ON EITHER SIDE TO GIVE US SOME ROOM
		// REVERSE THE RANGE SO THAT THE SMALLER VALUES ARE ON THE RIGHT
		var x = d3.scale.linear()
			.domain([1750, 2020])
			.range([0, width]);

		// Y SCALE
		// SET THE DOMAIN TO GO FROM 1 TO 36 SINCE WE HAVE 35 DATA POINTS AND WANT A LITTLE EXTRA SPACE AT THE BOTTOM
		// AND FIT IT TO OUR HEIGHT WE SET EARLIER
		// BUT IT'S FLIPPED BECAUSE WE GO FROM TOP-LEFT TO BOTTOM-RIGHT WITH SVG
		var y = d3.time.scale()
    		.domain([new Date(2012, 0, 1), new Date(2012, 11, 31)])
			.range([0, height]);

		// X-AXIS
		// PUT THE X-AXIS ON THE BOTTOM AND FORMAT THE TICKS TO BE MINUTES AND SECONDS
		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(40,"")
			.tickFormat(formatYear);

		// Y-AXIS
		// PUT THE Y-AXIS ON THE LEFT AND FORMAT THERE TO BE 7 TICKS FOR THE RANKINGS
		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.ticks(d3.time.months)
		    .tickFormat(d3.time.format("%B"));

		// TOOLTIP, CURRENTLY EMPTY AND HIDDEN
		var tooltip = d3.select(".mainContainer").append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);

		// CREATE A SPACE FOR THE CHART TO BE FORMED
		var chart = d3.select(".chart")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// APPEND THE X-AXIS
		// HAVE IT START IN THE BOTTOM-LEFT CORNER
		// ALSO APPEND A LABEL AND ANCHOR IT IN THE MIDDLE
		chart.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.attr("x", width/2)
			.attr("dx", "0em")
			.attr("dy", "2.8em")
			.attr("class", "xLabel")
			.style("text-anchor", "middle")
			.text("Year");

		// APPEND THE Y-AXIS
		// ALSO APPEND A LABEL FOR THE Y-AXIS AND ROTATE IT 90 DEGREES AND ANCHOR IT IN THE MIDDLE
		chart.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
	        .attr("y", 0 - margin.left)
	        .attr("x", 0 - (height / 2))
	        .attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Month");

		// SHIFT THE MONTH LABELS DOWN TO BE IN THE MIDDLE OF EACH TICK
		var yTicks = d3.select(".y.axis").selectAll(".tick").selectAll("text")
			.attr("dy", "1.6em");

		// FIND THE MIN AND MAX OF THE TEMPERATURE VARIANCE
		var tempVariance = [];
		for (var i = 0; i < data.length; i++) {
			tempVariance.push(data[i].variance);
		}
		var tempLow = d3.min(tempVariance) + baseTemperature;
		var tempHigh = d3.max(tempVariance) + baseTemperature;
		var tempVarianceRange = tempHigh - tempLow;
		
		// CREATE OUR COLOR SCHEME
		var bucketsBreakpoints = [];
		for (var i = 0; i < bucketsLength; i++) {
			if (i == 0) {
				bucketsBreakpoints.push(parseFloat(tempLow.toFixed(1)));
			} else {
				bucketsBreakpoints.push(parseFloat(((i * tempVarianceRange/bucketsLength) + tempLow).toFixed(1)));
			}
		}
		bucketsBreakpoints.push(parseFloat(tempHigh.toFixed(1)));

		console.log(tempLow);
		console.log(tempHigh);
		console.log(tempVarianceRange);
		console.log(bucketsBreakpoints);


		// CREATE THE BARS THAT MAKE UP OUR BAR CHART
		// GO THROUGH EACH DATA POINT
		// CREATE A RECTANGLE FOR IT
		// SET THE X COORDINATE FOR IT USING THE YEAR (JUST A NUMBER, NOT REALLY A DATE)
		// SET THE Y COORDINATE FOR IT USING THE MONTH (ACTUALLY A DATE, AND USING 2012 AS AN ARBITRARY YEAR BECAUSE WE ONLY HAVE ONE YEAR OF MONTHS)
		// SET THE COLOR BASED ON THE VALUE OF THE VARIATION
		// SET THE HEIGHT OF THE BAR USING THE EQUALLY DIVIDED HEIGHTS WE CALCULATED EARLIER
		// SET THE WIDTH OF THE BAR USING THE EQUALLY DIVIDED WIDTHS WE CALCULATED EARLIER
		// FINALLY, SET THE MOUSEOVER/MOUSEOUT EFFECTS FOR THE TOOLTIP, SETTING THE TOOLTIP CONTENT AND POSITION BASED ON THE BAR HOVERED OVER
		chart.selectAll(".bar")
			.data(data)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d) {
				return x(d.year);
			})
			.attr("y", function(d) {
				return y(new Date(2012, d.month-1)) - 2;
			})
			.style("fill", function (d) {
				for (var i = 0; i < colors.length; i++) {
					if (d.variance + baseTemperature > bucketsBreakpoints[i]) {
						continue;
					} else {
						return colors[i];
					}
				}
				return colors[colors.length-1];
			})
			.attr("height", barHeight)
			.attr("width", barWidth)
			.on("mouseover", function(d) {
				var rect = d3.select(this);
				rect.attr("class", "mouseover");
				tooltip.transition()
					.duration(200)
					.style("opacity", 0.9);
				var temperature = ((d.variance + baseTemperature) * (9/5)) + 32;
				var month = months[d.month-1];
				tooltip.html("<span class='date'>" + d.year + " - " + month + "</span><br><span class='temperature'>" + temperature.toFixed(2) + "&deg; F</span>")
					.style("left", (d3.event.pageX - 180) + "px")
        			.style("top", (d3.event.pageY - 120) + "px");
			})
			.on("mouseout", function() {
				var rect = d3.select(this);
				rect.attr("class", "mouseoff");
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
			});

		// ADD LEGEND TO BOTTOM OF CHART
		$(".legendContainer").prepend("<div class='legendHeader'>Temperature Bands (&deg;F)</div>");
		$(".legendContainer").append("<div class='legendLabels'></div>");
		for (var i = 0; i < colors.length; i++) {
			$(".legend").append("<div class='colorBucket' style='background: " + colors[i] + ";'></div>");
			var tempFahrenheit = ((bucketsBreakpoints[i] * (9/5)) + 32).toFixed(1);
			$(".legendLabels").append("<div class='colorBucket'>" + tempFahrenheit + "</div>");
		}
		var tempFahrenheit = ((bucketsBreakpoints[bucketsBreakpoints.length-1] * (9/5)) + 32).toFixed(1);
		$(".legendLabels").append("<div class='colorBucket' style='position: absolute;'>" + tempFahrenheit + "</div>");
				// .attr("class", "colorBucket")
				// .attr("width: 40px")
				// .attr("height: 40px")
				// .attr("background", function (d) { return d; });

	});

});