//OBJECT MONOPOLY DECLARED
var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 10;
Monopoly.doubleCounter = 0;
Monopoly.playersMoney;
Monopoly.rollAgain = false;



//ON PAGE LOAD, BOARD IS SET UP AND GAME IS READY TO BEGIN
Monopoly.init = function () {
    $(document).ready(function () {
        Monopoly.adjustBoardSize();
        $(window).bind("resize", Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();
    });
};


//FIRST POP-UP
Monopoly.start = function () {
    Monopoly.showPopup("intro")
};


//PRIMARY DICE FUNCTION
Monopoly.initDice = function () {
    $(".dice").click(function () {
        if (Monopoly.allowRoll) {
            Monopoly.rollDice();
        }
    });
};


//RETRIEVING INFO OF PLAYER FOR UPDATES:

Monopoly.getCurrentPlayer = function () {
    return $(".player.current-turn");
};

Monopoly.getPlayersCell = function (player) {
    return player.closest(".cell");
};


Monopoly.getPlayersMoney = function (player) {
    return parseInt(player.attr("data-money"));
};


//UPDATING PLAYER MONEY ON PAYMENTS, RECEIPTS
Monopoly.updatePlayersMoney = function (player, amount) {
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;

    if (playersMoney <= 0) { //when player is broke //this function does not work
        Monopoly.setNextPlayerTurn();
        $(player).removeAttr("data-money")

        $(".property").removeClass(player).addClass("available")

            .removeAttr("id")
            .removeAttr("title")
            .removeClass("player");
        Monopoly.showPopup("broke");

    }
    else {
        player.attr("data-money", playersMoney);
        player.attr("title", player.attr("id") + ": $" + playersMoney);
        Monopoly.playSound("chaching");
    }
};


//PLAYER ROLLS 2 DICE
Monopoly.rollDice = function () {
    Monopoly.rollAgain = false;
    var result1 = Math.floor(Math.random() * 6) + 1;
    var result2 = Math.floor(Math.random() * 6) + 1;
    $(".dice").find(".dice-dot").css("opacity", 0);
    $(".dice#dice1").attr("data-num", result1).find(".dice-dot.num" + result1).css("opacity", 1);
    $(".dice#dice2").attr("data-num", result2).find(".dice-dot.num" + result2).css("opacity", 1);
    if (result1 == result2) { //when player rolls a double
        Monopoly.doubleCounter++;
        Monopoly.rollAgain = true;
    }
    var currentPlayer = Monopoly.getCurrentPlayer();
    Monopoly.handleAction(currentPlayer, "move", result1 + result2);
};


//PLAYER MOVES RELEVANT AMOUNT OF SPACES
Monopoly.movePlayer = function (player, steps) {
    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function () {
        if (steps == 0) {
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        } else {
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    }, 200);
};


//ON PLAYER TURN, PLAYER CAN LAND ON A SPACE THAT MIGHT HAVE A SPECIAL 'SITUATION'
Monopoly.handleTurn = function () {
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);
    if (playerCell.is(".available.property")) {
        Monopoly.handleBuyProperty(player, playerCell);
    } else if (playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))) {
        Monopoly.handlePayRent(player, playerCell);
    } else if (playerCell.is(".property:not(.available)") && playerCell.hasClass(player.attr("id"))) {
        player.addClass("homeProperty");
        Monopoly.setNextPlayerTurn(player);
    } else if (playerCell.is(".go-to-jail")) {
        Monopoly.handleGoToJail(player);
        player.addClass("jailed");
    } else if (playerCell.is(".chance")) {
        Monopoly.handleChanceCard(player);
    } else if (playerCell.is(".community")) {
        Monopoly.handleCommunityCard(player);
    } else {
        Monopoly.setNextPlayerTurn(player);
    }
}


//CHANGING PLAYERS
Monopoly.setNextPlayerTurn = function () {
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    //IF PLAYER DID NOT GET A DOUBLE, GAME IS USUAL
    if (Monopoly.rollAgain === false) {
        var playerId = parseInt(currentPlayerTurn.attr("id").replace("player", ""));
        var nextPlayerId = playerId + 1;
        if (nextPlayerId > $(".player").length) {
            nextPlayerId = 1;
        }
        currentPlayerTurn.removeClass("current-turn");
        var nextPlayer = $(".player#player" + nextPlayerId);
        nextPlayer.addClass("current-turn");
        nextPlayer.removeClass("homeProperty");
        //when the player is jailed:
        if (nextPlayer.is(".jailed")) {
            var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
            currentJailTime++;
            nextPlayer.attr("data-jail-time", currentJailTime);
            if (currentJailTime == 4) {
                nextPlayer.addClass("current-turn")
                nextPlayer.removeClass("jailed");
                nextPlayer.removeAttr("data-jail-time");
                currentJailTime = 0;
            }
            Monopoly.setNextPlayerTurn();
            return;
        }
        Monopoly.closePopup();
        Monopoly.allowRoll = true;
        // currentPlayerTurn.removeClass("homeProperty");
    } else {
        //WHEN PLAYER DOES ROLL A DOUBLE HE IS THE NEXT PLAYER
        var playerId = parseInt(currentPlayerTurn.attr("id").replace("player", ""));
        var nextPlayerId = playerId + 0;
        if (nextPlayerId > $(".player").length) {
            nextPlayerId = 1;
        }
        currentPlayerTurn.removeClass("current-turn");
        var nextPlayer = $(".player#player" + nextPlayerId);
        nextPlayer.addClass("current-turn");
        nextPlayer.removeClass("homeProperty");
        //when the player is jailed:
        if (nextPlayer.is(".jailed")) {
            var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
            currentJailTime++;
            nextPlayer.attr("data-jail-time", currentJailTime);
            if (currentJailTime <= 3) {
                nextPlayer.addClass("current-turn")
                nextPlayer.removeClass("jailed");
                nextPlayer.removeAttr("data-jail-time");
                currentJailTime = 0;
            }
            Monopoly.setNextPlayerTurn();
            return;
        }
        Monopoly.closePopup();
        Monopoly.allowRoll = true;
        currentPlayerTurn.removeClass("homeProperty");
    }

};


//PLAYER GIVEN OPTION TO PURCHASE AVAILABLE PROPERTY
Monopoly.handleBuyProperty = function (player, propertyCell) {
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click", function () {
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")) {
            Monopoly.handleBuy(player, propertyCell, propertyCost);
        } else {
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};


//PLAYER LANDS ON ANOTHER PLAYER'S PROPERTY AND HAS TO PAY RENT
Monopoly.handlePayRent = function (player, propertyCell) {
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    popup.find("button").unbind("click").bind("click", function () {
        var properyOwner = $(".player#" + properyOwnerId);
        Monopoly.updatePlayersMoney(player, currentRent);
        Monopoly.updatePlayersMoney(properyOwner, -1 * currentRent);
        Monopoly.closeAndNextTurn();
    });
    Monopoly.showPopup("pay");
};


//IF PLAYER LANDS ON A CHANCE CARD SPACE
Monopoly.handleChanceCard = function (player) {
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function (chanceJson) {
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action", chanceJson["action"]).attr("data-amount", chanceJson["amount"]);
    }, "json");
    popup.find("button").unbind("click").bind("click", function () {
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player, action, amount);
    });
    Monopoly.showPopup("chance");
};


//IF PLAYER LANDS ON A COMMUNITY CARD SPACE
Monopoly.handleCommunityCard = function (player) {
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function (chanceJson) {
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action", chanceJson["action"]).attr("data-amount", chanceJson["amount"]);
    }, "json");
    popup.find("button").unbind("click").bind("click", function () {
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player, action, amount);
    });
    Monopoly.showPopup("community");
};


//PLAYER MUST GO TO JAIL
Monopoly.handleGoToJail = function (player) {
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click", function () {
        Monopoly.handleAction(player, "jail");
        player.addClass("jailed");
    });
    Monopoly.showPopup("jail");
};


//PLAYER IS SENT TO JAIL
Monopoly.sendToJail = function (player) {
    player.addClass("jailed");
    player.attr("data-jail-time", 1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup("jailed");
};


//POP UPS
Monopoly.getPopup = function (popupId) {
    return $(".popup-lightbox .popup-page#" + popupId);
};


//PROPERTY COSTS
Monopoly.calculateProperyCost = function (propertyCell) {
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group", "")) * 5;
    if (cellGroup == "rail") {
        cellPrice = 10;
    }
    return cellPrice;
};


//RENT COSTS
Monopoly.calculateProperyRent = function (propertyCost) {
    return propertyCost / 2;
};


//PLAYER TURN CHANGES WHEN POP UP CLOSES
Monopoly.closeAndNextTurn = function () {
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};


//NUMBER OF PLAYERS POP UP
Monopoly.initPopups = function () {
    $(".popup-page#intro").find("button").click(function () {
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers", numOfPlayers)) {
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};


//PLAYER PURCHASES PROPERTY
Monopoly.handleBuy = function (player, propertyCell, propertyCost) {
    var playersMoney = Monopoly.getPlayersMoney(player)
    //PLAYER CANNOT AFFORD
    if (playersMoney < propertyCost) {
        Monopoly.showErrorMsg();
        Monopoly.playSound("fail");
        //PLAYER CAN AFFORD
    } else {
        Monopoly.updatePlayersMoney(player, propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);
        propertyCell.removeClass("available")
            .addClass(player.attr("id"))
            .attr("data-owner", player.attr("id"))
            .attr("data-rent", rent);
        Monopoly.setNextPlayerTurn();
    }
};


//POSSIBLE ACTIONS 
Monopoly.handleAction = function (player, action, amount) {
    switch (action) {
        case "move":
            Monopoly.movePlayer(player, amount);
            break;
        case "pay":
            Monopoly.updatePlayersMoney(player, amount);
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
}


//PLAYERS CREATED
Monopoly.createPlayers = function (numOfPlayers) {
    var startCell = $(".go");
    for (var i = 1; i <= numOfPlayers; i++) {
        var player = $("<div />").addClass("player shadowed").attr("id", "player" + i).attr("title", "player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i == 1) {
            player.addClass("current-turn");
        }
        player.attr("data-money", Monopoly.moneyAtStart);
    }
};


//PLAYER MOVES AROUND BOARD
Monopoly.getNextCell = function (cell) {
    var currentCellId = parseInt(cell.attr("id").replace("cell", ""));
    var nextCellId = currentCellId + 1
    if (nextCellId > 40) {
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};


//PLAYER PASSED GO - COLLECTS 50!
Monopoly.handlePassedGo = function () {
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player, Monopoly.moneyAtStart / 2 - 100);
};


//USER ENTERS NUMBER OF PLAYERS - CHECK FOR VALID NUMBER (1-6)
Monopoly.isValidInput = function (validate, value) {
    var isValid = false;
    switch (validate) {
        case "numofplayers":
            if (value > 1 && value <= 6) {
                isValid = true;
            }
            break;
    }

    if (!isValid) {
        Monopoly.showErrorMsg();
    }
    return isValid;
}


//ERROR MESSAGES
Monopoly.showErrorMsg = function () {
    $(".popup-page .invalid-error").fadeTo(500, 1);
    setTimeout(function () {
        $(".popup-page .invalid-error").fadeTo(500, 0);
    }, 2000);
};


//BOARD SIZING
Monopoly.adjustBoardSize = function () {
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(), $(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) * 2;
    $(".board").css({ "height": boardSize, "width": boardSize });
}


//POP UP CLOSES
Monopoly.closePopup = function () {
    $(".popup-lightbox").fadeOut();
};


//SOUND EFFECTS
Monopoly.playSound = function (sound) {
    var snd = new Audio("./sounds/" + sound + ".wav");
    snd.play();
}


//POP UPS
Monopoly.showPopup = function (popupId) {
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

Monopoly.init();