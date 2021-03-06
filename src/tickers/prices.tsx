import * as React from 'react';
import { Balance, TickerInfo } from 'types';
import Ticker from './ticker';
import { subscribe_ws, query_ticker } from 'api';
import { to_percent, set_price, filter_valid_tokens } from 'utils';
import { AppContext } from 'App';
import { get_mem_store, set_mem_store } from '../utils/mem_store';

interface Props {
  // tickers: Balance;
}

let sorter_desc = true;

export type TickerDetailedInfo = {
  available: number;
  freeze: number;
  ticker: string;
  price: number;
  usdt_amount: number;
  change: number;
  decimal: number
};

const Prices = (prop: Props) => {
  const { balance, set_balance, selected_tab } = React.useContext(AppContext);

  const [sorter, set_sorter] = React.useState(() => (a, b) =>
    b.usdt_amount - a.usdt_amount
  );
  const [collapse_all, set_collapse_all] = React.useState(false);

  const toggle_sorter = (key: string) => {
    set_sorter(() => {
      const multiplyer = sorter_desc ? 1 : -1;
      const res = (a, b) => {
        if (typeof a[key] === 'string') {
          return (a[key].charCodeAt(0) - b[key].charCodeAt(0)) * multiplyer;
        } else {
          return (b[key] - a[key]) * multiplyer;
        }
      };
      sorter_desc = !sorter_desc;

      return res;
    });
  };

  const tickers_arr = filter_valid_tokens(balance, sorter);

  React.useEffect(() => {
    /**
     * 获取最初价格信息
     */
    setTimeout(() => {
      Promise.all(
        tickers_arr.map(({ ticker }) =>
          query_ticker(`${ticker}_USDT`).then(data =>
            set_balance(t => ({
              ...t,
              [ticker]: set_price(t[ticker], data.result)
            }))
          )
        )
      ).then(r => {
        setTimeout(() => {
          set_mem_store('init_price_fetched', true);
        }, 500);
      });
    }, 300);
  }, []);

  // if (selected_tab !== 'price' && get_mem_store('window_width') < 800)
  //   return null;

  return (
    <div
      className='table ticker-list'
      style={{
        display: selected_tab === 'price' || get_mem_store('window_width') > 800? '' : 'none'
      }}
    >
      <p className='flexSpread ticker-header'>
        <span onClick={() => toggle_sorter('ticker')}>Token</span>
        <span onClick={() => toggle_sorter('price')}>
          Price
          <span onClick={() => toggle_sorter('change')}></span>
        </span>
        <span onClick={() => toggle_sorter('usdt_amount')}>USDT</span>
        <span>
          Action&nbsp;
          <span
            onClick={() => set_collapse_all(!collapse_all)}
            className='fs-8'
          >
            Collapse All
          </span>
        </span>
      </p>
      {tickers_arr.map((b, _idx) => (
        <Ticker
          key={b.ticker}
          ticker={balance[b.ticker]}
          collapse_all={collapse_all}
        ></Ticker>
      ))}
    </div>
  );
};

export default Prices;
