import React, { FormEvent, useState, useEffect } from "react";
import css from "./App.css";

const QUOTE = "`";
const INPUT_TEXT_SIZE = 14;
// some browser default
const INPUT_BORDER = 3;

function fetchData(cmdArgs: string[]): Promise<any> {
  const path = "/cmd";
  const query = new URLSearchParams({ args: JSON.stringify(cmdArgs) });
  return fetch(`${path}?${query}`);
}

function getHelp(completeCmdArgs: string[]): Promise<string[] | undefined> {
  const helpData = fetchData(completeCmdArgs.concat(["help"])).then((res) => res.json());
  return helpData.then((helpObj) => helpObj?.cmdlist);
}

function getSuggestions(cmdlist: string[] = [], lastPartialArg: string) {
  if (lastPartialArg === "") {
    return cmdlist;
  }
  const suggestions: string[] = [];

  for (const cmd of cmdlist) {
    const sameFirstLetter = cmd[0] === lastPartialArg[0];
    const match = cmd.indexOf(lastPartialArg) > -1;
    if (match && sameFirstLetter) {
      suggestions.push(cmd);
    }
  }
  if (!suggestions.length) {
    for (const cmd of cmdlist) {
      const sameFirstLetter = cmd[0] === lastPartialArg[0];
      const insensitiveMatch = cmd.toLowerCase().indexOf(lastPartialArg.toLowerCase()) > -1;
      if (insensitiveMatch && sameFirstLetter) {
        suggestions.push(cmd);
      }
    }
  }
  if (!suggestions.length) {
    for (const cmd of cmdlist) {
      const insensitiveMatch = cmd.toLowerCase().indexOf(lastPartialArg.toLowerCase()) > -1;
      if (insensitiveMatch) {
        suggestions.push(cmd);
      }
    }
  }
  if (!suggestions.length) {
    for (const cmd of cmdlist) {
      suggestions.push(cmd);
    }
  }
  return suggestions;
}

const _cache = new Map();

function parseCommand(command: string): string[] {
  const args: string[] = [];
  const word: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    const space = " ";
    if (!inQuotes && char === space) {
      word.length && args.push(word.join(""));
      word.length = 0;
      continue;
    }
    if (char === QUOTE) {
      if (inQuotes) {
        word.length && args.push(word.join(""));
        word.length = 0;
        inQuotes = false;
      } else {
        inQuotes = true;
      }
      continue;
    }
    word.push(char);
  }
  args.push(word.join(""));
  return args;
}

export const App = () => {
  const [suggestionsState, setSuggestionsState] = useState<string[]>([]);
  const [commandState, setCommandState] = useState<string>("");
  const [enterPressed, setEnterPressed] = useState<number>(0);
  const [tabPressed, setTabPressed] = useState<number>(0);
  const [fetchCount, setFetchCount] = useState<number>(0);

  if (!_cache.has(commandState)) _cache.set(commandState, []);
  const commandResponses = _cache.get(commandState);

  useEffect(() => {
    const cmdArgs = parseCommand(commandState);
    fetchData(cmdArgs)
      .then((res) => res.text())
      .then((text) => {
        commandResponses.push(text);
        setFetchCount(fetchCount + 1);
      });
  }, [enterPressed]);

  const onTabPressed = async (command: string) => {
    const cmdArgs = parseCommand(command);
    const lastPartialArg = cmdArgs[cmdArgs.length - 1] ?? "";
    const completeCmdArgs = cmdArgs.slice(0, -1);
    const cmdlist = await getHelp(completeCmdArgs);
    const suggestions = getSuggestions(cmdlist, lastPartialArg);
    setTabPressed(tabPressed + 1);
    if (suggestions.length === 0) {
      setSuggestionsState([]);
      return command;
    }
    if (suggestions.length === 1) {
      setSuggestionsState([]);
      const autocompleted = completeCmdArgs.concat(suggestions[0]).join(" ");
      setCommandState(autocompleted);
      return autocompleted;
    }
    setSuggestionsState(suggestions);
    return command;
  };
  const onEnterPress = (command: string) => {
    setEnterPressed(enterPressed + 1);
    setCommandState(command);
  };
  return (
    <>
      <div className={css.cmdInputWrapper}>
        <CmdInput onTabPress={onTabPressed} onEnterPress={onEnterPress}></CmdInput>
        <Suggestions>{suggestionsState}</Suggestions>
      </div>
      <Screen>{commandResponses}</Screen>
    </>
  );
};

function CmdInput({
  onTabPress,
  onEnterPress,
}: {
  onTabPress: (command: string) => Promise<string>;
  onEnterPress: (command: string) => any;
}) {
  useEffect(() => {
    const cmdInput = document.getElementById("cmdInput") as HTMLTextAreaElement;
    // set initial font size
    cmdInput.style.fontSize = INPUT_TEXT_SIZE + "px";
    // set initial height
    cmdInput.style.height = INPUT_TEXT_SIZE + INPUT_BORDER + "px";
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };
  const handleOnKeyDown = async (e: React.KeyboardEvent) => {
    const { key } = e;
    const target = e.target as HTMLTextAreaElement;
    const { value: command } = target;
    const lastLetter = command[command.length - 1];
    const inQuotes = _cache.get(QUOTE);
    if (QUOTE === key) {
      if (inQuotes) {
        _cache.set(QUOTE, false);
      } else {
        _cache.set(QUOTE, true);
      }
    }
    if (key === "Backspace") {
      const lastLetterWasNewLine = lastLetter === "\n";
      if (lastLetterWasNewLine) {
        // decrease textarea size
        const heightToSubtract = INPUT_TEXT_SIZE + INPUT_BORDER;
        let cmdHeight = _cache.get("cmdHeight");
        if (cmdHeight) {
          cmdHeight[0] = cmdHeight[0] - heightToSubtract;
          target.style.height = cmdHeight[0] + "px";
        }
      }
    }
    if (inQuotes) {
      if (key === "Tab") {
        e.preventDefault();
        target.value = target.value + "  ";
      }
      if (key === "Enter") {
        // increase textarea size
        const heightToAdd = INPUT_TEXT_SIZE + INPUT_BORDER;
        let cmdHeight = _cache.get("cmdHeight");
        cmdHeight = cmdHeight ?? _cache.set("cmdHeight", [INPUT_TEXT_SIZE]).get("cmdHeight");
        cmdHeight[0] = cmdHeight[0] + heightToAdd;
        target.style.height = cmdHeight[0] + "px";
      }
      if (key === "Backspace") {
        const lastLetterWasQuote = lastLetter === QUOTE;
        // if beginning quote deleted
        if (lastLetterWasQuote) {
          _cache.set(QUOTE, false);
        }
      }
      return;
    }
    if (!inQuotes) {
      if (key === "Backspace") {
        const lastLetterWasQuote = lastLetter === QUOTE;
        // if last quote was deleted
        if (lastLetterWasQuote) {
          _cache.set(QUOTE, true);
        }
      }
    }
    if (["Tab", "Enter"].includes(key)) {
      e.preventDefault();
    }
    if ("Tab" === key) {
      const autoCorrected = await onTabPress(command);
      target.value = autoCorrected;
    }
    if ("Enter" === key) {
      onEnterPress(command);
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          <textarea id="cmdInput" autoFocus className={css.cmdInput} onKeyDown={handleOnKeyDown} />
        </label>
      </form>
    </>
  );
}

function Suggestions({ children: suggestions }: { children: string[] }) {
  return (
    <>
      <div className={css.unselectable}>
        <code>{(suggestions.length && `Suggestions: ${suggestions.join(" ")}`) || ""}</code>
      </div>
    </>
  );
}

function Screen({ children }: { children: string[] }) {
  const responses = children.reverse().map((response, i) => {
    return (
      <>
        <div className={css.response}>
          {response.split("\n").map((line) => (
            <div className={css["fill-width"]}>
              <code className={css.code}> {line} </code>
            </div>
          ))}
        </div>
        <div>
          <span className={css.unselectable}>{"-".repeat(50)}</span>
          <span>,</span>
        </div>
      </>
    );
  });
  return <pre className={css.screen}>[{responses}]</pre>;
}
