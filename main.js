var core = require('./core');
var MM = core.MetricManager,
	VC = core.VariableCost,
	RS = core.RevenueStream,
	MC = core.MiscellaneousCost,
	Estimator = core.Estimator;
var _estimator = null;

function init () {
	var e = Estimator();
	e.set('vpc', MM(0.78*0.5)); // viewer %
	e.set('bpc', MM(0.6*0.027)); // buyer %
	e.set('avgv', MM(10)); // spend per viewer
	e.set('avgb', MM(500*0.15*1.55)); // spend per buyer

	e.team().addUnit('C', 'CTO', 1, 100000);
	e.team().addUnit('C', 'CMO', 1, 100000);
	e.team().addUnit('TECH', 'SDE2', 1, 50000);
	e.team().addUnit('TECH', 'SDE1', 2, 30000);
	e.team().addUnit('TECH', 'ANDROID', 2, 40000);
	e.team().addUnit('TECH', 'UI', 2, 30000);
	e.team().addUnit('MKT', 'MGR', 1, 30000);
	e.team().addUnit('MKT', 'EXEC', 0, 15000);

	e.addCost('salary', (function(){ return { cost: e.team().salary, total: e.team().total_salary } })());
	e.addCost('variable', VC(e.users(), e.get('vpc')));
	e.addCost('misc', MC(e.team(), e.users()));

	e.addRevenue('ecom', RS(e.users(), e.get('bpc'), e.get('avgb')));
	e.addRevenue('stv', RS(e.users(), e.get('vpc'), e.get('avgv')));
	_estimator = e;
	return e;
}

function process () {
	var e = _estimator;
	var month = 0;
	for (month = 1; month <= 3; month++) e.next();
	for (month = 4; month <= 6; month++) {
		e.users().constant(10000, 1);
		e.next();
	}
	for (month = 7; month <= 18; month++) {
		if ((month - 7) % 4 === 0) e.team().addUnit('support', 'exec', 2, 15000);
		e.users().compound(0.05, 4);
		e.next();
	}
	for (month = 19; month <= 36; month++) {
		if ((month - 19) % 4 === 0) e.team().addUnit('support', 'exec', 20, 15000);
		e.users().compound(0.03, 4);
		e.next();
	}
	for (month = 37; month <= 60; month++) {
		if ((month - 37) % 4 === 0) e.team().addUnit('support', 'exec', 30, 15000);
		e.users().compound(0.02, 4);
		e.next();
	}
	return e;
}
function pretty(x) {
	x = Math.round(x/1000);
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function display () {
	var e = _estimator;
	if (!e) return console.log('Nothing to display!');
	console.log('Month\tUsers\tCost\tRevenue\tProfit');
	var m = e.monthly();
	m.forEach(function(i){
		console.log(i.month
					+ '\t' + pretty(i.users)
					+ '\t' , pretty(i.cost)
					+ '\t' , pretty(i.revenue)
					+ '\t' , Math.round((i.revenue - i.cost)*100/i.cost));
	});
	console.log('Aggregate Data: ');
	var a = e.aggregate();
	console.log('Users: \t\t', pretty(e.users().value) + 'k');
	console.log('Cost: \t\t', pretty(a.total_cost) + 'k');
	console.log('Revenue: \t', pretty(a.total_revenue) + 'k');
	console.log('Income: \t', pretty(a.total_income) + 'k');
	console.log('Profit: \t', Math.round(a.total_income*100/a.total_cost));
}

module.exports = {
	run: function() {
		init();
		process();
		display();
	}
};

module.exports.run();
