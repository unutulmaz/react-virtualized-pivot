import React, { PureComponent } from 'react'
import { Grid, AutoSizer, ScrollSync } from 'react-virtualized'
import { ContentBox }
	from '../ContentBox/ContentBox.jsx'
import FilterMenu from '../FilterMenu/FilterMenu.jsx'
import cn from 'classnames'
import scrollbarSize from 'dom-helpers/util/scrollbarSize'
import Pivot from 'quick-pivot';
import Select from 'react-select-plus';
import ReactSortable from '../ReactSortable/ReactSortable.jsx';

import 'react-select-plus/dist/react-select-plus.css';
import './styles.scss';

export default class QuickPivot extends PureComponent{
	constructor(props){
		super(props);

		this.state = {
				aggregationDimensions: this.props.data[0].map((item, index) => {
					return {value: item, label: item}
				}),
				colFields: [],
				pivot: new Pivot(this.props.data, [], [],
					this.props.selectedAggregationDimension || '', 'sum'),
				dataArray: this.props.data,
				fields: this.props.data[0],
				rowFields: [],
				selectedAggregationType: 'sum',
				selectedAggregationDimension: this.props.selectedAggregationDimension || '',
				filterValues: {},
				filterMenuToDisplay: {},

				columnWidth: 75,
	      columnCount: 0,
	      overscanColumnCount: 0,
	      overscanRowCount: 5,
	      rowHeight: 40,
	      rowCount: 0,
				data:{},
				header:{},
				headerCounter: 0,
    };

		this.onSelectAggregationDimension =
			this.onSelectAggregationDimension.bind(this);
		this.onSelectAggregationType = this.onSelectAggregationType.bind(this);
		this.onAddUpdateField = this.onAddUpdateField.bind(this);
		this.onToggleRow = this.onToggleRow.bind(this);
		this.checkIfInCollapsed = this.checkIfInCollapsed.bind(this);

		this.forceRenderGrid = this.forceRenderGrid.bind(this);
		this.renderBodyCell = this.renderBodyCell.bind(this);
    this.renderHeaderCell = this.renderHeaderCell.bind(this);
    this.renderLeftHeaderCell = this.renderLeftHeaderCell.bind(this);
    this.renderLeftSideCell = this.renderLeftSideCell.bind(this);

		this.displayFilter = this.displayFilter.bind(this);
		this.addFilter = this.addFilter.bind(this);
		this.submitFilters = this.submitFilters.bind(this);
	}

	componentWillReceiveProps(nextProps) {
    this.setState({
			aggregationDimensions: nextProps.data[0].map((item, index) => {
				return {value: item, label: item}
			}),
			dataArray: nextProps.data,
			data: {},
			headers: {},
			fields: nextProps.data[0],
			selectedAggregationDimension: '',
			colFields: [],
			rowFields: [],
		})
  }

	onSelectAggregationType(selectedAggregationType) {
		const {
			colFields,
			dataArray,
			rowFields,
			selectedAggregationDimension,
		} = this.state;

		const pivotedData = new Pivot(
			dataArray,
			rowFields,
			colFields,
			selectedAggregationDimension,
			selectedAggregationType.value
		);

		let headerCounter = 0;

		if(pivotedData.data){
			while(true) {
				if (pivotedData.data.table[headerCounter].type === 'colHeader') {
					headerCounter += 1;
				} else {
					break;
				}
			}
		}

		this.setState({
			headerCounter,
			pivot: pivotedData,
			selectedAggregationType: selectedAggregationType.value,
			columnCount: (pivotedData.data.table.length &&
				pivotedData.data.table[0].value.length) ?
				pivotedData.data.table[0].value.length : 0,
			rowCount: pivotedData.data.table.length || 0,
			data: pivotedData.data.table,
			header: pivotedData.data.table[0]
		})

		this.forceRenderGrid();
	}

	onSelectAggregationDimension (selectedAggregationDimension) {
		const {
			colFields,
			dataArray,
			rowFields,
			selectedAggregationType,
		} = this.state;

		const pivotedData = new Pivot(
			dataArray,
			rowFields,
			colFields,
			selectedAggregationDimension.value,
			selectedAggregationType
		);

		let headerCounter = 0;

		if (pivotedData.data) {
			while(true) {
				if (pivotedData.data.table[headerCounter].type === 'colHeader') {
					headerCounter += 1;
				} else {
					break
				}
			}
		}

		this.setState({
			headerCounter,
			pivot: pivotedData,
			selectedAggregationDimension: selectedAggregationDimension.value,
			columnCount: (pivotedData.data.table.length &&
				pivotedData.data.table[0].value.length) ?
				pivotedData.data.table[0].value.length : 0,
			rowCount: pivotedData.data.table.length || 0,
			data: pivotedData.data.table,
			header: pivotedData.data.table[0]
		})

		this.forceRenderGrid();
	}

	onAddUpdateField() {
		const {
			dataArray,
			rowFields,
			colFields,
			selectedAggregationDimension,
			selectedAggregationType,
		} = this.state;

		const pivotedData = new Pivot(
			dataArray,
			rowFields,
			colFields,
			selectedAggregationDimension,
			selectedAggregationType
		);

		let headerCounter = 0;

		if (pivotedData.data) {
			while(true) {
				if (pivotedData.data.table[headerCounter].type === 'colHeader') {
					headerCounter += 1;
				} else {
					break
				}
			}
		}

		this.setState({
			headerCounter,
			pivot: pivotedData,
			columnCount: (pivotedData.data.table.length &&
					pivotedData.data.table[0].value.length) ?
				pivotedData.data.table[0].value.length : 0,
			rowCount: pivotedData.data.table.length || 0,
			data: pivotedData.data.table,
			header: pivotedData.data.table[0],
		});

		this.forceRenderGrid();
	}

	onToggleRow(rowIndex) {
		const {
			pivot
		} = this.state;
		//row index +1 because we remove/slice the header row off the data we render
		//in the renderBodyCell
		const newPivot = pivot.toggle(rowIndex + 1);
		this.setState(
		{
			pivot: newPivot,
			columnCount: (newPivot.data.table.length &&
				newPivot.data.table[0].value.length) ?
			newPivot.data.table[0].value.length : 0,
			rowCount: newPivot.data.table.length || 0,
			data: newPivot.data.table,
			header: newPivot.data.table[0],
		});
		this.forceRenderGrid();
	}

	checkIfInCollapsed(rowIndex) {
		const {
			pivot,
		} = this.state;

		return pivot.data.table[rowIndex + 1].row in pivot.collapsedRows
	}

	forceRenderGrid() {
		if (this.header) {
			this.header.recomputeGridSize({columnIndex: 0, rowIndex: 0});
		}
		if (this.leftHeader) {
			this.leftHeader.recomputeGridSize({columnIndex: 0, rowIndex: 0});
		}
		if (this.grid) {
			this.grid.recomputeGridSize({columnIndex: 0, rowIndex: 0});
		}
		if (this.bodyGrid) {
			this.bodyGrid.recomputeGridSize({columnIndex: 0, rowIndex: 0});
		}
		// console.log(this.refs.filter.sortable.options.onUpdate())
		// this.filter.sortable.options.onUpdate();
	}

	renderBodyCell({ columnIndex, key, rowIndex, style }) {
		if (columnIndex < 1) {
			return
		}

		return this.renderLeftSideCell({ columnIndex, key, rowIndex, style })
	}

	renderHeaderCell({ columnIndex, key, rowIndex, style }) {
		if (columnIndex < 1) {
			return
		}
		return this.renderLeftHeaderCell({ columnIndex, key, rowIndex, style })
	}

	renderLeftHeaderCell({ columnIndex, key, rowIndex, style }) {
		const {
			data,
		} = this.state;

		return (
			<div
				className={'headerCell'}
				key={key}
				style={style}
			>
				{`${data.length ?
					data[rowIndex].value[columnIndex] : ''}`}
			</div>
		)
	}

	renderLeftSideCell({ columnIndex, key, rowIndex, style }) {
		const {
			data,
			headerCounter,
			rowFields,
		} = this.state;

		const rowClass = rowIndex % 2 === 0
			? columnIndex % 2 === 0 ? 'evenRow' : 'oddRow'
			: columnIndex % 2 !== 0 ? 'evenRow' : 'oddRow';
		const classNames = cn(rowClass, 'cell');
		const firstColumnStyle = {};
			if (columnIndex === 0) {
				firstColumnStyle['paddingLeft'] =
					`${20 * data.slice(headerCounter)[rowIndex].depth}px`
			}
			if (rowFields.length === 1 ||
					data.slice(headerCounter)[rowIndex].depth <
						rowFields.length - 1) {
					firstColumnStyle['fontWeight'] = 'bold';
			}

		const arrowStyle = (rowIndex) => {
			//rowIndex - 1 because we are checking against the pivot data
			if(this.checkIfInCollapsed(rowIndex)){
				return '►';
			}
			if (data.slice(headerCounter)[rowIndex].depth < rowFields.length - 1) {
				return '▼';
			}
			return '';
		}

		return (
			<div
				className={classNames}
				key={key}
				style={Object.assign({}, firstColumnStyle, style)}
				onClick={this.onToggleRow.bind(this, rowIndex)}
			>
				{ columnIndex === 0 ? arrowStyle(rowIndex) : ''}
				{`${data.length ?
					data.slice(headerCounter)[rowIndex].value[columnIndex] : ''}`}
			</div>
		)
	}

	displayFilter(fieldName) {
		const {
			filterMenuToDisplay,
			filterValues,
			pivot
		} = this.state;

		//row index +1 because we remove/slice the header row off the data we render
		//in the renderBodyCell
		const uniqueValues = pivot.getUniqueValues(fieldName);
		// this.setState(
		// {
		// 	pivot: newPivot,
		// 	columnCount: (newPivot.data.table.length &&
		// 		newPivot.data.table[0].value.length) ?
		// 	newPivot.data.table[0].value.length : 0,
		// 	rowCount: newPivot.data.table.length || 0,
		// 	data: newPivot.data.table,
		// 	header: newPivot.data.table[0],
		// });

		filterValues[fieldName] = uniqueValues;
		filterMenuToDisplay[fieldName] = true;
		this.setState({
			filterMenuToDisplay,
			filterValues,
		})
	}

	addFilter() {
		return null;
	}

	submitFilters(){
		console.log('subitting filters')
		return null;
	}

	render() {
		const {
			aggregationDimensions,
			selectedAggregationType,
			selectedAggregationDimension,
			columnCount,
      columnWidth,
			headerCounter,
      overscanColumnCount,
      overscanRowCount,
      rowHeight,
      rowCount,
			filterValues,
		} = this.state;

		const height = (window.innerHeight - 240 - (this.state.headerCounter * 40))

		const aggregationTypes = [
	    { value: 'sum', label: 'sum' },
	    { value: 'count', label: 'count' },
		];

		//We are not using deconstructed state consts here due to
		// react-sortablejs bug
		const fields = this.state.fields.length ? this.state.fields.map((field, index) =>
			{ return (
				<li
					key={index}
					data-id={field}
				>
					{field}
					<FilterMenu
						field={field}
						filterValues={this.state.filterValues}
						displayFilter={this.displayFilter}
						filterMenuToDisplay={this.state.filterMenuToDisplay}
						submitFilters={this.submitFilters}
					>
					</FilterMenu>
				</li>
			)}
		) : ''
		const rowFieldsRender = this.state.rowFields.map((field, index) =>
			(
				<li
				key={index}
				data-id={field}>
				{field}
				<FilterMenu
					field={field}
					filterValues={this.state.filterValues}
					displayFilter={this.displayFilter}
					filterMenuToDisplay={this.state.filterMenuToDisplay}
					submitFilters={this.submitFilters}
				>
				</FilterMenu>
			</li>
		));

		const colFieldsRender = this.state.colFields.map((field, index) =>
			(
				<li
				key={index}
				data-id={field}>
				{field}
				<FilterMenu
					field={field}
					filterValues={this.state.filterValues}
					displayFilter={this.displayFilter}
					filterMenuToDisplay={this.state.filterMenuToDisplay}
					submitFilters={this.submitFilters}
				>
				</FilterMenu>
			</li>
		));

		return(
			<section className="quick-pivot">
				<div className="pivot-options">
	       <div className="selectors-container">
						<div className="select-container">
	          <div className="title">Aggregation Type</div>
							<Select
							    name="Aggregation Type"
									value={selectedAggregationType}
							    options={aggregationTypes}
							    onChange={this.onSelectAggregationType}
									menuContainerStyle={{ zIndex: 2000 }}
							/>
         	</div>

         	<div className="select-container">
	          <div className="title">Aggregation Dimension</div>
							<Select
									name="Aggregation Type"
									value={selectedAggregationDimension}
									options={aggregationDimensions}
									onChange={this.onSelectAggregationDimension}
									menuContainerStyle={{ zIndex: 2000 }}
							/>
	      	</div>
	       </div>

				 <div className="fields-drag-container">
						<div className="fields">
							<div className="title">Fields</div>
			        <ReactSortable
								className="sortable-container block__list block__list_tags"
								handle='.my-handle'
								onChange={fields => this.setState({fields})}
		            options={{
		              group: 'shared',
		              onAdd: this.onAddUpdateField,
									onChoose: () => console.log('onStart', this.setState(this.state)),
									onStart: console.log('onStart', this.setState(this.state)),
									onEnd:function(){console.log('onEnd')},
									onAdd:function(){console.log('onAdd')},
									onUpdate:function(){console.log('onUpdate')},
									onSort:function(){console.log('onSort')},
									onRemove:function(){console.log('onRemove')},
									onFilter:function(){console.log('onFilter')},
									onMove:function(){console.log('onMove')},
									onClone:function(){console.log('onClone')},
		            }}
								ref='filter'
		            tag="ul"
							>
			        	{fields}
			        </ReactSortable>
		        </div>

		        <div className="rows">
							<div className="title">Rows</div>
			        <ReactSortable
								className="sortable-container block__list block__list_tags"
								onChange={rowFields => this.setState({rowFields})}
		            options={{
	                group: 'shared',
	                onAdd: this.onAddUpdateField,
	                onUpdate: this.onAddUpdateField,
		            }}
		            tag="ul"
								ref='filter'
							>
			          {rowFieldsRender}
			        </ReactSortable>
		        </div>

		        <div className="columns">
							<div className="title">Columns</div>
			        <ReactSortable
								className="sortable-container block__list block__list_tags"
								onChange={(colFields) => this.setState({colFields})}
		            options={{
	                group: 'shared',
	                onAdd: this.onAddUpdateField,
	                onUpdate: this.onAddUpdateField,
		            }}
		            tag="ul"
								ref='filter'
							>
			          {colFieldsRender}
			        </ReactSortable>
		        </div>
	        </div>
				</div>
				<div className="pivot-grid">

					<section className='pivot-grid'>
		        <ContentBox>
		        <ScrollSync>
		          {({
								clientHeight,
								clientWidth,
								onScroll,
								scrollHeight,
								scrollLeft,
								scrollTop,
								scrollWidth
							}) => {
		            const x = scrollLeft / (scrollWidth - clientWidth);
		            const y = scrollTop / (scrollHeight - clientHeight);
								const leftHeaderCellTextColor = '#ffffff';
		            const headerGridTextColor = '#ffffff';
								const leftSideGridTextColor = '#ffffff';
		            const bodyGridTextColor = '#ffffff';

		            return (
		              <div className="GridRow">
		                <div
		                  className="LeftSideGridContainer"
		                  style={{
		                    position: 'absolute',
		                    left: 0,
		                    top: 0,
		                    color: leftHeaderCellTextColor,
												height: rowHeight * headerCounter,
												width: columnWidth,
		                  }}
		                >
		                  <Grid
		                    ref={(input) => { this.header = input; }}
		                    cellRenderer={this.renderLeftHeaderCell}
		                    className={'HeaderGrid'}
		                    width={columnWidth}
		                    height={rowHeight * headerCounter}
		                    rowHeight={rowHeight}
		                    columnWidth={columnWidth}
		                    rowCount={headerCounter}
		                    columnCount={1}
		                  />
		                </div>
		                <div
		                  className="LeftSideGridContainer"
		                  style={{
		                    position: 'absolute',
		                    left: 0,
		                    top: rowHeight * headerCounter,
		                    color: leftSideGridTextColor,
		                  }}
		                >
		                  <Grid
		                    ref={(input) => { this.leftHeader = input; }}
		                    overscanColumnCount={overscanColumnCount}
		                    overscanRowCount={overscanRowCount}
		                    cellRenderer={this.renderLeftSideCell}
		                    columnWidth={columnWidth}
		                    columnCount={1}
		                    className={'LeftSideGrid'}
		                    height={height - scrollbarSize()}
		                    rowHeight={rowHeight}
		                    rowCount={rowCount === 0 ? 0 : (rowCount - headerCounter)}
		                    scrollTop={scrollTop}
		                    width={columnWidth}
		                  />
		                </div>
		                <div className="GridColumn">
		                  <AutoSizer
		                    disableHeight
		                  >
		                    {({ width }) => (
		                      <div>
		                        <div
		                          style={{
		                            color: headerGridTextColor,
		                            height: rowHeight * headerCounter,
		                            width: width - scrollbarSize(),
		                          }}
		                        >
		                          <Grid
		                            ref={(input) => { this.grid = input; }}
		                            className="HeaderGrid"
		                            columnWidth={columnWidth}
		                            columnCount={columnCount}
		                            height={rowHeight * headerCounter}
		                            overscanColumnCount={overscanColumnCount}
		                            cellRenderer={this.renderHeaderCell}
		                            rowHeight={rowHeight}
		                            rowCount={headerCounter}
		                            scrollLeft={scrollLeft}
		                            width={width - scrollbarSize()}
		                          />
		                        </div>
		                        <div
		                          style={{
		                            color: bodyGridTextColor,
		                            height,
		                            width,
		                          }}
		                        >
		                          <Grid
		                            ref={(input) => { this.bodyGrid = input; }}
		                            className="BodyGrid"
		                            columnWidth={columnWidth}
		                            columnCount={columnCount}
		                            height={height}
		                            onScroll={onScroll}
		                            overscanColumnCount={overscanColumnCount}
		                            overscanRowCount={overscanRowCount}
		                            cellRenderer={this.renderBodyCell}
		                            rowHeight={rowHeight}
		                            rowCount={rowCount === 0 ? 0 : (rowCount - headerCounter)}
		                            width={width}
		                          />
		                        </div>
		                      </div>
		                    )}
		                  </AutoSizer>
		                </div>
		              </div>
		            )
		          }}
		        </ScrollSync>
		      </ContentBox>
		    </section>
				</div>
			</section>
		);
	}
}
