import { Badge } from '../models/badge.model';


export const BADGES: Badge[] = [
  {
    id: 'newbie',
    name: 'Newbie',
    svg: '/assets/badges/newbie.png',
    description: 'You started your coding journey!',
    points: 100,
    threshold: 1,
    activity: 'login'
  },

  {
    id: 'hello-world',
    name: 'Hello World',
    svg: '/assets/badges/hello-world.png',
    description: 'You ran your very first Hello World program!',
    points: 100,
    threshold: 1,
    activity: 'hello-world'
  },

  {
    id: 'quiz-ace',
    name: 'Quiz Ace',
    svg: '/assets/badges/quiz-ace.png',
    description: 'You successfully completed a quiz!',
    points: 100,
    threshold: 1,
    activity: 'quiz'
  },

  {
    id: 'full-day',
    name: 'Full Day',
    svg: '/assets/badges/full-day.png',
    description: 'You spent a full day learning and coding!',
    points: 100,
    threshold: 1,
    activity: 'learning'
  },
  {
    id: '10-days',
    name: '10 Days',
    svg: 'assets/badges/10-day.png',
    description: 'You reached a 10-day learning streak!',
    points: 100,
    threshold: 10,
    activity: 'login'
  },

  {
    id: 'good-habit',
    name: 'Good Habit',
    svg: 'assets/badges/good-habit.png',
    description: 'You built a great habit of learning!',
    points: 100,
    threshold: 15,
    activity: 'login'
  },
  {
    id: 'hot-streak',
    name: 'Hot Streak',
    svg: 'assets/badges/hot-streak.png',
    description: 'You built an awesome learning streak!',
    points: 100,
    threshold: 20,
    activity: 'login'
  },

  {
    id: '25-days',
    name: '25 Days',
    svg: 'assets/badges/25-day.png',
    description: 'You reached a 25-day learning streak!',
    points: 100,
    threshold: 25,
    activity: 'login'
  },

  {
    id: 'fanatic',
    name: 'Fanatic',
    svg: '/assets/badges/fanatic.png',
    description: 'You kept coming back to learn and code!',
    points: 100,
    threshold: 35,
    activity: 'login'
  },
  {
    id: 'devoted',
    name: 'Devoted',
    svg: 'assets/badges/devoted.png',
    description: 'You stayed dedicated to your coding journey!',
    points: 100,
    threshold: 40,
    activity: 'login'
  },

  {
    id: '50-days',
    name: '50 Days',
    svg: 'assets/badges/50-day.png',
    description: 'You reached a 50-day learning streak!',
    points: 100,
    threshold: 50,
    activity: 'login'
  },

  {
    id: '100-days',
    name: '100 Days Logged In',
    svg: 'assets/badges/100-day.png',
    description: 'You reached an amazing 100-day learning streak!',
    points: 100,
    threshold: 100,
    activity: 'login'
  },

  {
    id: 'coder',
    name: 'Coding Machine',
    svg: 'assets/badges/code-machine.png',
    description: 'You became a true coding machine!',
    points: 100,
    threshold: 150,
    activity: 'login'
  },
  {
    id: 'master',
    name: 'Master',
    svg: 'assets/badges/master.png',
    description: 'You became a true master of the coding journey!',
    points: 100,
    threshold: 200,
    activity: 'login'
  },

  {
    id: 'veteran',
    name: 'Veteran',
    svg: 'assets/badges/veteran.png',
    description: 'You became a true veteran of the coding journey!',
    points: 100,
    threshold: 250,
    activity: 'login'
  }



];
