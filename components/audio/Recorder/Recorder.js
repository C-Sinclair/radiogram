import { useEffect, useReducer, useRef, useState } from "react";
import * as Tone from "tone";
import Controls from "../Controls/Controls.js";
import Effects from "../Effects/Effects.js";
import { SectionRoot, RecordBtn, MicLevel } from "./Recorder.styles.js";

/**
 * @typedef {Object} RecorderState
 * @prop {'idle' | 'recording' | 'complete'} RecorderState.status -- the recording status
 * @prop {?Date} RecorderState.startTime
 * @prop {?Blob} RecorderState.blob -- completed file blob
 * @prop {FxConfig} RecorderState.fx
 *
 * @typedef {Object} FxConfig
 * @prop {?boolean} reverse
 * @prop {?PhaserFxConfig} phaser
 *
 * @typedef {Object} PhaserFxConfig
 * @prop {number} freq
 */

let recorder;
let interval;

/**
 * @type {RecorderState}
 * @constant
 */
const initialState = {
  status: "idle",
  fx: {},
};

export default function Recorder() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [level, setLevel] = useState(0);

  const player = useRef();
  const phaser = useRef();

  useEffect(() => {
    recorder = new Tone.Recorder();
    const meter = new Tone.Meter(0);
    const mic = new Tone.UserMedia();

    mic.open().then(() => {
      mic.connect(recorder);
      mic.connect(meter);
      interval = setInterval(() => {
        setLevel(Math.abs(meter.getValue()));
      }, 250);
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (player?.current) {
      player.current.reverse = state.fx.reverse;
      if (state.fx.phaser) {
        if (!phaser?.current) {
          phaser.current = new Tone.Phaser({
            frequency: state.fx.phaser.freq,
            octaves: 5,
            baseFrequency: 1000,
          }).toDestination();
          player.current.connect(phaser.current);
        } else {
          phaser.current.set({
            frequency: state.fx.phaser.freq,
          });
        }
      }
    }
  }, [state.fx]);

  const onRecClick = async () => {
    if (state.status !== "recording") {
      recorder.start();
      dispatch({ type: "start" });
    } else {
      const blob = await recorder.stop();
      dispatch({ type: "stop", payload: blob });

      const url = URL.createObjectURL(blob);
      player.current = new Tone.Player(url);
      player.current.toDestination();
    }
  };

  const onPlayClick = () => player.current.start();

  const onPauseClick = () => player.current.stop();

  const onReverseClick = () =>
    dispatch({
      type: "effect-change",
      payload: { reverse: !state.fx.reverse },
    });

  const onPhaserFreqChange = (e) =>
    dispatch({
      type: "effect-change",
      payload: { phaser: { freq: e.target.value } },
    });

  return (
    <SectionRoot>
      <MicLevel style={{ ["--level"]: level }} />
      <RecordBtn onClick={onRecClick}>
        {state.status === "recording" ? "Stop" : "Record"}
      </RecordBtn>
      {state.status === "complete" ? (
        <>
          <article>
            {/* <p>{state.startTime.toString()}</p> */}
            <p>{Math.round(player?.current?.buffer.duration)}s</p>
          </article>

          <Controls onPlay={onPlayClick} onPause={onPauseClick} />
          <Effects
            onReverse={onReverseClick}
            onPhaserFreq={onPhaserFreqChange}
          />
        </>
      ) : null}
    </SectionRoot>
  );
}

/**
 *
 * @param {RecorderState} state
 * @param {{ type: string }} action
 * @returns {RecorderState}
 */
function reducer(state, action) {
  switch (action.type) {
    case "start":
      return {
        ...state,
        status: "recording",
        startTime: new Date(),
      };
    case "stop":
      return {
        ...state,
        status: "complete",
        blob: action.payload,
      };
    case "effect-change":
      return {
        ...state,
        fx: {
          ...state.fx,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}
