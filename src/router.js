import Vue from 'vue'
import Router from 'vue-router'

// Main Navigation
import Home from './views/Home.vue'
import TripPlanner from './views/TripPlanner.vue'
import NexTrip from './views/NexTrip.vue'
import FindStops from './views/FindStops.vue'
import MapsSchedules from './views/MapsSchedules.vue'
import RideCosts from './views/RideCosts.vue'
import GoToCard from './views/GoToCard.vue'
import DiscountPrograms from './views/DiscountPrograms.vue'
import ContactUs from './views/ContactUs.vue'
import TransitPolice from './views/TransitPolice.vue'
import HowToRideGuide from './views/HowToRideGuide.vue'
import More from './views/More.vue'

// Components
import Buttons from './views/Buttons.vue'

Vue.use(Router)

export default new Router({
	mode: 'history',
	routes: [
		// Main navigation
		{
			path: '/',
			name: 'home',
			component: Home
		},
		{
			path: '/trip-planner',
			name: 'trip-planner',
			component: TripPlanner
		},
		{
			path: '/nextrip',
			name: 'nextrip',
			component: NexTrip
		},
		{
			path: '/find-stops',
			name: 'find-stops',
			component: FindStops
		},
		{
			path: '/schedules-maps',
			name: 'schedules-maps',
			component: MapsSchedules
		},
		{
			path: '/ride-costs',
			name: 'ride-costs',
			component: RideCosts
		},
		{
			path: '/goto-card',
			name: 'goto-card',
			component: GoToCard
		},
		{
			path: '/discount-programs',
			name: 'discount-programs',
			component: DiscountPrograms
		},
		{
			path: '/contact-us',
			name: 'contact-us',
			component: ContactUs
		},
		{
			path: '/transit-police',
			name: 'transit-police',
			component: TransitPolice
		},
		{
			path: '/how-to-ride-guide',
			name: 'how-to-ride-guide',
			component: HowToRideGuide
		},
		{
			path: '/more',
			name: 'more',
			component: More
		},
		// Components
		{
			path: '/buttons',
			name: 'buttons',
			component: Buttons
		}
	]
})
