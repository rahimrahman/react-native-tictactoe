import React from 'react';
import { Pressable, View, Text } from 'react-native';

interface TicTacToeProps {
  board: any;
  hasWon: boolean;
}

type DirectionRowColumn = 'row' | 'column';
type DirectionUpDown = 'up' | 'down';

interface MovesProps {
  [key: string]: any[];
}

interface DirectionValueProps {
  direction: DirectionRowColumn | DirectionUpDown;
  value: number;
}

interface PlayerMoveStatsProps {
  [key: string]: {
    row: any;
    column: any;
    diagonal: any;
  }
}

interface WinningPathProps {
  [key: string]: DirectionValueProps[];
}

class TicTacToe extends React.Component<{}, TicTacToeProps> {
  private debug: boolean = false;
  private currentPlayer: string = "X";
  private computerPlayer?: string = "X";
  private boardLength: number = 3;
  private moves: MovesProps = { "X": [], "O": [] };
  private playerMoveStats: PlayerMoveStatsProps = {
    "X": { "row": {}, "column": {}, "diagonal": {} },
    "O": { "row": {}, "column": {}, "diagonal": {} }
  };

  private winningPath: WinningPathProps = { "X": [], "O": [] };
  constructor(props:TicTacToeProps) {
    super(props);

    const board = this.initializeBoard();
    this.state = {
      board,
      hasWon: false
    };
    // this.boardLength = this.state.board.length;
  }

  public componentDidMount() {
    if (this.computerPlayer === "X") {
      this.computerMoves();
    }
  }

  private initializeBoard = () => {
    const board: any = [];
    for (let i = 0; i < this.boardLength; i++) {
      board.push([]);
      for (let j = 0; j < this.boardLength; j++) {
        board[i].push('');
      }
    }
    return board;
  }

  public render() {
    return (
      <View>
        <View>
          {this.renderRows()}
        </View>
        <View><Text>{this.state.hasWon ? "WON" : ""}</Text></View>
      </View>
    )
  }

  private renderRows = () => {
    const rows = [];
    for (let i = 0; i < this.boardLength; i++) {
      rows.push(this.renderRow(i))
    }
    return rows;
  }

  private renderRow = (row: number) => {
    const columns = [];
    for (let i = 0; i < this.boardLength; i++) {
      columns.push(this.renderColumn(row, i))
    }
    return (
      <View key={`row:${row}`} style={{ flexDirection: 'row' }}>
        {columns}
      </View>
    )
  }

  private renderColumn = (row: number, column: number) => {
    return (
      <Pressable key={`${row}:${column}`} onPress={() => this.mark(row, column)}>
        <View style={this.renderStyle(row, column)}>
          <Text>[ {this.state.board[row][column]} ]</Text>
        </View>
      </Pressable>
    );
  }

  private renderStyle = (row: number, column: number) => {
    return undefined;
  }

  private mark = (row: number, column: number) => {
    if (this.state.hasWon) return;
    const isMarked = this.state.board[row][column];
    if (isMarked) return;

    const { board } = this.state;
    board[row][column] = this.currentPlayer;
    this.moves[this.currentPlayer] = [ ...this.moves[this.currentPlayer], { row, column } ];
    this.setState({ board }, () => {
      this.checkForWin(row, column, this.currentPlayer);
      this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";

      if (this.computerPlayer === this.currentPlayer) {
        this.computerMoves();
      }
    });
    // race condition if changing
    // console.log(this.moves);
  }

  private checkRowOrColumn = (player: string, direction: DirectionRowColumn, value: number): boolean => {
    const { boardLength, playerMoveStats } = this;
    const thePlayerPath = playerMoveStats[player][direction];
    const theOtherPlayerPath = playerMoveStats[this.otherPlayer(player)][direction];
    const theOtherPlayerPathCount = theOtherPlayerPath[`${value}`] || 0;
    const count:number = (thePlayerPath[`${value}`] || 0) + 1;
    thePlayerPath[`${value}`] = count;
    // if (this.debug) console.log('player', player, 'direction', direction, 'count', count, 'theOtherPlayerPathCount', theOtherPlayerPathCount, `${direction}`, value);
    console.log(playerMoveStats);
    if (count === boardLength) {
      if (this.debug) console.log(`${player} :: ${direction} ${value} => winner`);
      this.setState({ hasWon: true })
      return true;
    } else if (count === (boardLength - 1) && (!theOtherPlayerPathCount)) {
      this.winningPath[player].push({ direction, value });
    }
    return false;
  }

  private otherPlayer = (player: string): string => {
    return player === 'X' ? 'O' : 'X';
  }

  private checkDiagonal = (player: string, direction: DirectionUpDown, row: number, column: number) => {
    const { boardLength, playerMoveStats } = this;
    const otherPlayerDiagCount = playerMoveStats[this.otherPlayer(player)]['diagonal'][direction] || 0;
    let diagCount = 0;
    if ((direction === 'down' && row - column === 0) || direction === 'up' && (column + row === boardLength - 1)) {
      diagCount = (playerMoveStats[player]['diagonal'][direction] || 0) + 1;
      playerMoveStats[player]['diagonal'][direction] = diagCount;
    }
    if (this.debug) console.log('player', player, 'direction', direction, 'diagCount', diagCount, 'otherPlayerDiagCount', otherPlayerDiagCount, 'column', column, 'row', row);
    if (diagCount === 2 && !otherPlayerDiagCount) {
      this.winningPath[player].push({ direction, value: 1 });
    }
    const result = diagCount === boardLength;
    if (result) {
      this.setState({ hasWon: true })
    }
    return result;
  }

  private checkRow = (player: string, row: number): boolean => {
    return this.checkRowOrColumn(player, 'row', row);
  }

  private checkColumn = (player: string, column: number): boolean => {
    return this.checkRowOrColumn(player, 'column', column);
  }

  private checkDiagonalUp = (player: string, row: number, column: number) => {
    return this.checkDiagonal(player, 'up', row, column);
  }

  private checkDiagonalDown = (player: string, row: number, column: number) => {
    return this.checkDiagonal(player, 'down', row, column);
  }

  private checkForWin = (row: number, column: number, player: string) => {
    // this.winningPath = { "X": [], "O": [] };
    // const { boardLength, playerMoveStats } = this;
    this.checkRow(player, row);
    this.checkColumn(player, column);
    this.checkDiagonalDown(player, row, column);
    this.checkDiagonalUp(player, row, column);
  }
  // [0:0] [0:1] [0:2]
  // [1:0] [1:1] [1:2]
  // [2:0] [2:1] [2:2]

  private computerMoves = () => {
    if (!this.computerPlayer) return;

    const { boardLength, computerPlayer } = this;
    const computerMoves = this.moves[computerPlayer];
    const lastComputerMove = computerMoves[computerMoves.length - 1];
    const computerPotentialWinPath = this.winningPath[computerPlayer]

    const humanPlayer = this.otherPlayer(computerPlayer);
    const humanMoves = this.moves[humanPlayer];
    const humanPotentialWinPath = this.winningPath[humanPlayer]
    const humanMovesCount = humanMoves.length;
    const lastHumanMove = humanMoves[humanMovesCount - 1];


    let nextColumn: number;
    let nextRow: number;

    if (this.computerPlayer === "X") { // computer go first
      switch(humanMovesCount) {
        case 0:
          nextRow = Math.round(Math.random()) * 2;
          nextColumn = Math.round(Math.random()) * 2;
          this.mark(nextRow, nextColumn);
          break;
        case 1:
          if (this.isCenter(lastHumanMove.row, lastHumanMove.column)) {
            // pick closest corner
            nextRow = Math.round(Math.random());
            nextColumn = computerMoves[0].column;
            if (nextRow === computerMoves[0].row) {
              nextColumn = Math.abs(nextColumn - 1);
            }
            this.mark(nextRow, nextColumn);
          } else if (this.isTheInside(lastHumanMove.row, lastHumanMove.column) || this.isCorner(lastHumanMove.row, lastHumanMove.column)) {
            const rowDiff = lastComputerMove.row - lastHumanMove.row;
            const columnDiff = lastComputerMove.column - lastHumanMove.column;

            if (!rowDiff && columnDiff) {
              this.mark(lastComputerMove.row ? 0 : boardLength - 1, lastComputerMove.column);
            } else if (!columnDiff && rowDiff) {
              this.mark(lastComputerMove.row, lastComputerMove.column ? 0 : boardLength - 1);
            } else {
              this.mark(lastHumanMove.row, lastComputerMove.column);
            }
          }
          break;
        case 2:
          if (!this.isWinOrBlock()) {
            // ref
            // [0:0] [0:1] [0:2]
            // [1:0] [1:1] [1:2]
            // [2:0] [2:1] [2:2]
            let row = lastComputerMove.row;
            let column = lastComputerMove.column;
            const rowDiff = Math.abs(lastComputerMove.row - computerMoves[0].row);
            const columnDiff = Math.abs(lastComputerMove.column - computerMoves[0].column);
            console.log(rowDiff, columnDiff);
            if (!rowDiff) {
              row = lastComputerMove.row ? 0 : 2;
            }

            if (!columnDiff) {
              column = lastComputerMove.column ? 0 : 2;
            }

            console.log(row, column);
            this.mark(row, column);
          }
          break;
        default:
          this.isWinOrBlock();
          break;
      }
    }
  }

  private isWinOrBlock = () => {
    if (!this.computerPlayer) return;
    const computerPotentialWinPath = this.winningPath[this.computerPlayer];
    const humanPotentialWinPath = this.winningPath[this.otherPlayer(this.computerPlayer)];
    console.log(computerPotentialWinPath);
    console.log(humanPotentialWinPath);

    // do we need to win?
    if (computerPotentialWinPath.length) {
      const blockValue = this.block(computerPotentialWinPath[0].direction, computerPotentialWinPath[0].value);
      if (blockValue) {
        this.mark(blockValue.row, blockValue.column);
        return true;
      }
    } else if (humanPotentialWinPath.length) {
      const blockValue = this.block(humanPotentialWinPath[0].direction, humanPotentialWinPath[0].value);
      if (blockValue) {
        this.mark(blockValue.row, blockValue.column);
        return true;
      }
    }
    return false;
  }

  private block = (direction: string, value: number): { row: number, column: number } | undefined => {
    let row = value;
    let column = value;
    if (direction === 'up') {
      row = this.boardLength - 1;
      column = 0;
    }
    for (let i = 0; i < this.boardLength; i++) {
      if (direction === 'row') {
        column = i;
      } else if (direction === 'column') {
        row = i;
      } else if (direction === 'up') {
        row = row - i;
        column = column + i;
      } else if (direction === 'down') {
        row = i;
        column = i;
      }
      if (this.state.board[row][column] === '') {
        return { row, column }
      }
    }
  }




  private isTheInside = (row: number, column: number) => {
    // only good for 3x3
    return Math.abs(row - column) === 1;
  }

  private isCorner = (row: number, column: number) => {
    // only good for 3x3
    return (Math.abs(row - column) === 2 || (row - column === 0));
  }

  private isCenter = (row: number, column: number) => {
    const middle = Math.floor(this.boardLength / 2);
    return (row === middle && column === middle);
  }

}

export default TicTacToe;

// reference
// [0:0] [0:1] [0:2] [0:3] [0:4]
// [1:0] [1:1] [1:2] [1:3] [1:4]
// [2:0] [2:1] [2:2] [2:3] [2:4]
// [3:0] [3:1] [3:3] [3:3] [3:4]
// [4:0] [4:1] [4:2] [4:3] [4:4]
