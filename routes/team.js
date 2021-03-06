var Team = require('../model/Team');
var permissions = require('../helper/permissions');

exports.getByTournamentID = function(req, res) {
	permissions.tournament(req, res, req.params.id, function() {
		Team.getByTournamentID(req.params.id, function(err, teams) {
			if(err) {
				res.send(500, err);
			} else {
				var result = [];
				teams.forEach(function(team) {
					result.push(team.toJson());
				});
				res.json(result);
			}
		});
	});
};

exports.addToTournament = function(req, res) {
	permissions.tournament(req, res, req.params.id, function() {
		var team = new Team({
			tournamentID: req.params.id,
			number: req.body.teamNumber,
			division: req.body.division,
			name: req.body.teamName,
			state: req.body.state,
			school: req.body.school,
			scoreAdjustment: req.body.scoreAdjustment
		});
		team.addToTournament(function(err) {
			if(err) {
				res.send(500, err);
			} else {
				res.json(team.toJson());
			}
		});
	});
};

exports.update = function(req, res) {
	permissions.tournament(req, res, req.params.id, function() {
		var team = new Team({
			tournamentID: req.params.id,
			number: req.body.number,
			division: req.body.division,
			name: req.body.name,
			state: req.body.state,
			school: req.body.school,
			scoreAdjustment: req.body.scoreAdjustment
		});
		team.update(function(err) {
			if(err) {
				res.send(500, err);
			} else {
				res.json(team.toJson());
			}
		});
	});
};

exports.remove = function(req, res) {
	permissions.tournament(req, res, req.params.id, function() {
		var team = new Team({
			tournamentID: req.params.id,
			number: req.body.number,
			division: req.body.division,
			name: req.body.name,
			state: req.body.state,
			school: req.body.school,
			scoreAdjustment: req.body.scoreAdjustment
		});
		team.remove(function(err) {
			if(err) {
				res.send(500, err);
			} else {
				res.json(team.toJson());
			}
		});
	});
};

exports.getCoaches = function(req, res) {
	console.log(" " +req.params.id+" "+ req.params.teamNumber+" "+req.params.division);
	permissions.tournament(req, res, req.params.id, function() {
		var team = new Team({
			tournamentID: req.params.id,
			number: req.params.teamNumber,
			division: req.params.division
		});
		team.getCoaches(function(err, result) {
			if(err) {
				res.send(500, err);
			} else {
				res.json(result);
			}
		});
	});
};