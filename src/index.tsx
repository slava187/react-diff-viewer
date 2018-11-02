import { cx } from 'emotion'
import * as React from 'react'
import * as diff from 'diff'
import * as PropTypes from 'prop-types'
import cn from 'classnames'

import * as styles from './styles'
import { InlineLine, DefaultLine } from './line'

export interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  splitView?: boolean;
  wordDiff?: boolean;
  renderContent?: (source: string) => JSX.Element;
  onLineNumberClick?: (lineId: string) => void;
}

interface DiffViewerState {

}

const wordDiff = (oldValue: string, newValue: string, hideType: string, renderContent?: (source: string) => JSX.Element) => {
  const charDiff = diff.diffWordsWithSpace(oldValue, newValue)
  return charDiff.map((obj: any, i) => {
    if (obj[hideType]) return undefined
    if (renderContent) {
      return <span
        className={cn(styles.wordDiff, { [styles.wordAdded]: obj.added, [styles.wordRemoved]: obj.removed })}
        key={i}>
        { renderContent(obj.value) }
      </span>
    }
    return <pre
      className={cn(styles.wordDiff, { [styles.wordAdded]: obj.added, [styles.wordRemoved]: obj.removed })}
      key={i}>
      { obj.value }
    </pre>
  })
}
class DiffViewer extends React.PureComponent<DiffViewerProps, DiffViewerState> {

  static defaultProps = {
    splitView: true,
  }

  static propTypes = {
    oldValue: PropTypes.string.isRequired,
    newValue: PropTypes.string.isRequired,
    splitView: PropTypes.bool,
    wordDiff: PropTypes.bool,
    renderContent: PropTypes.func,
    onLineNumberClick: PropTypes.func,
  }

  splitView = (diffArray: any[]) => {
    let leftLineNumber = 0
    let rightLineNumber = 0

    return () => diffArray.map((obj: diff.IDiffResult, i) => {
      return <>
        {
          obj.value.split('\n')
            .filter(ch => ch.length > 0)
            .map((ch, num) => {
              if (!obj.added && !obj.removed) {
                rightLineNumber = rightLineNumber + 1
                leftLineNumber = leftLineNumber + 1
                return <DefaultLine
                  leftLineNumber={leftLineNumber}
                  rightLineNumber={rightLineNumber}
                  leftContent={ch}
                  rightContent={ch}
                  renderContent={this.props.renderContent}
                  onLineNumberClick={this.props.onLineNumberClick}
                />
              }
              if (obj.added) {
                rightLineNumber = rightLineNumber + 1
                let preContent
                let newContent
                if (diffArray[i - 1] && diffArray[i - 1].removed) {
                  const preValue = diffArray[i - 1].value
                    .split('\n')
                    .filter(Boolean)[num]
                  preContent = preValue && wordDiff(preValue, ch, 'added', this.props.renderContent)
                  newContent = preValue && wordDiff(preValue, ch, 'removed', this.props.renderContent)
                  if (preContent) {
                    leftLineNumber = leftLineNumber + 1
                  }
                }
                return <DefaultLine
                  leftLineNumber={preContent && leftLineNumber}
                  rightLineNumber={rightLineNumber}
                  removed={Boolean(preContent)}
                  added={obj.added}
                  renderContent={this.props.renderContent}
                  leftContent={preContent}
                  rightContent={preContent ? newContent : ch}
                  onLineNumberClick={this.props.onLineNumberClick}
                />
              }
            })
        }
      </>
    })
  }

  inlineView = (diffArray: diff.IDiffResult[]) => {
    let leftLineNumber = 0
    let rightLineNumber = 0
    return () => {
      return diffArray.map((diffObj, i) => {
        return diffObj.value.split('\n')
          .filter(ch => ch.length > 0)
          .map((ch, num) => {
            let content
            if (diffObj.added) {
              rightLineNumber = rightLineNumber + 1
              if (diffArray[i - 1] && diffArray[i - 1].removed) {
                const preValue = diffArray[i - 1].value
                  .split('\n')
                  .filter(Boolean)[num]
                  content = preValue ? wordDiff(preValue, ch, 'removed', this.props.renderContent) : ch
              }
            } else if (diffObj.removed) {
              leftLineNumber = leftLineNumber + 1
              if (diffArray[i + 1] && diffArray[i + 1].added) {
                const nextVal = diffArray[i + 1].value
                  .split('\n')
                  .filter(Boolean)[num]
                content = nextVal ? wordDiff(ch, nextVal, 'added', this.props.renderContent) : ch
              }
            } else {
              rightLineNumber = rightLineNumber + 1
              leftLineNumber = leftLineNumber + 1
              content = ch
            }
            return <InlineLine
              onLineNumberClick={this.props.onLineNumberClick}
              key={num}
              renderContent={this.props.renderContent}
              removed={diffObj.removed}
              leftLineNumber={diffObj.added || leftLineNumber}
              rightLineNumber={diffObj.removed || rightLineNumber}
              content={content}
              added={diffObj.added} />
          })
      })
    }
  }

  render = () => {
    const {
      oldValue,
      newValue,
      splitView,
    } = this.props

    const diffLines = diff.diffLines(oldValue, newValue)
    const nodes = splitView
      ? this.splitView(diffLines)()
      : this.inlineView(diffLines)()
    return (
      <table className={styles.diffContainer}>
        <tbody>
          {nodes}
        </tbody>
      </table>
    )
  }
}

export default DiffViewer
export { styles }
