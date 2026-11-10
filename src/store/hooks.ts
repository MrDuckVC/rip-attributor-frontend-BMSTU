import { useDispatch, useSelector, useStore } from 'react-redux'
import type { AppDispatch, AppStore, RootState } from './index'
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
export const selectBusy = (state: RootState) => state.author.loading
  || Object.keys(state.corpora.requests).length > 0 || Object.keys(state.corpusDraft.requests).length > 0
