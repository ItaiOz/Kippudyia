import React, { useEffect, useState, useRef } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import Button from "@mui/material/Button";
import { createClient } from "@supabase/supabase-js";
import { useGameStore } from "../../store/gameStore";
import { InputModal } from "../../common/Modal/InputModal";

const supabaseUrl: any = process.env.REACT_APP_PROJECT_URL;
const supabaseKey: any = process.env.REACT_APP_PUBLIC_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export const GameRegistration: React.FC<any> = () => {
  const setIsGameOn = useGameStore((state) => state.setIsGameOn);
  const setGameId = useGameStore((state) => state.setGameId);

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const name = localStorage.getItem("userName");

  const players = useGameStore((state) => state.players);
  const retrievePlayers = useGameStore((state) => state.retrievePlayers);

  const optionRef: any = useRef();
  const playerRef: any = useRef();

  const isGameAvialable = selectedPlayers.length > 3;

  const renderModal = () => {
    return (
      <InputModal
        isOpen={isModalOpen}
        onCloseModal={() => setIsModalOpen(false)}
        onInputInserted={(name: string) => startGame(name)}
      />
    );
  };

  const addPlayer = () => {
    if (!selectedOption) return;
    const isDuplicatedUser = selectedPlayers.find(
      (player) => player === selectedOption
    );
    if (isDuplicatedUser) return;
    const tempArr: any = [...selectedPlayers];
    tempArr.push(selectedOption);
    setSelectedPlayers(tempArr);
  };

  const onselectionchange = () => {
    setSelectedOption(optionRef.current.value);
  };

  const deletePlayer = (player: string) => {
    setSelectedPlayers((prevPlayers) => {
      return prevPlayers.filter((p) => p !== player);
    });
  };

  const startGame = async (name: any) => {
    localStorage.setItem("userName", name);

    let gameId;

    // Retrieve the last inserted ID from the table
    const { data: lastRecord, error: getError } = await supabase
      .from("games")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    // // Generate a new ID by incrementing the last inserted ID
    const nextId = lastRecord ? lastRecord[0].id + 1 : 1;

    const { data } = await supabase
      .from("games")
      .insert([{ id: nextId }])
      .select();
    if (data) {
      gameId = data[0].id;
      setGameId(gameId);
    } else {
      console.log("fix it");
      return;
    }
    const players = selectedPlayers.reduce((acc: any, currVal: string) => {
      acc[currVal] = 1;
      return acc;
    }, {});

    const { data: lastSessionRecord } = await supabase
      .from("poker-sessions")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    const nextSessionId = lastSessionRecord ? lastSessionRecord[0].id + 1 : 1;

    const { data: sessionData, error } = await supabase
      .from("poker-sessions")
      .insert([
        { id: nextSessionId, game_id: gameId, mekaped: name, players: players },
      ])
      .select();

    if (error) console.log(error);
    if (sessionData) setIsGameOn(true);
  };

  useEffect(() => {
    retrievePlayers();
  }, []);

  return (
    <div className="game-preperation-container">
      <h5>Choose Tonight's Players</h5>
      {selectedPlayers.map((player, index) => (
        <div className="tonights-players" key={index}>
          <span id={index.toString()} ref={playerRef}>
            {player}
          </span>
          <button className="bin-button" onClick={() => deletePlayer(player)}>
            <FaRegTrashAlt size={25} className="bin-icon" />
          </button>
        </div>
      ))}
      <div className="choose-player-block">
        <select
          className="players-options"
          onChange={onselectionchange}
          ref={optionRef}
        >
          <option>Select...</option>
          {players.map((player, index) => (
            <option key={index}>{player}</option>
          ))}
        </select>
        <Button
          className="add-button btn"
          size={"small"}
          variant="contained"
          onClick={addPlayer}
        >
          +
        </Button>
      </div>
      <Button
        disabled={!isGameAvialable}
        variant="contained"
        className="start-game-btn btn"
        onClick={() => (name ? startGame(name) : setIsModalOpen(true))}
      >
        Start Game!
      </Button>
      {renderModal()}
    </div>
  );
};
