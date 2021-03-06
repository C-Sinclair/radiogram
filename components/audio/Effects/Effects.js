import { useReducer } from "react";

export default function Effects({ onReverse, onPhaserFreq }) {
  const [show, setShow] = useReducer(openReducer, {});

  const onPhaserOn = () => setShow("phaser");

  return (
    <article>
      <button onClick={onReverse}>Reverse</button>

      <button onClick={onPhaserOn}>Phaser</button>
      {show.phaser ? (
        <div>
          <label>Frequency</label>
          <input type="number" onChange={onPhaserFreq} />
        </div>
      ) : null}

      {/* Reverb */}
      {/* Delay */}
      {/* BitCrusher */}
      {/* More Distortion */}
      {/* Filter */}
      {/* Pitch shift */}
    </article>
  );
}

function openReducer(state, action) {
  return {
    ...state,
    [action]: !state[action],
  };
}
