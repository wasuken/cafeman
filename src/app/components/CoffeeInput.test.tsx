import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CoffeeInput from './CoffeeInput'
import '@testing-library/jest-dom'

describe('CoffeeInput Component', () => {
  it('should render the component with initial state', () => {
    render(<CoffeeInput onAddCoffee={jest.fn()} todayCups={2} />)

    // Check for the title
    expect(screen.getByText('今日のコーヒー')).toBeInTheDocument()

    // Check for today's cup count
    expect(screen.getByText('2 杯')).toBeInTheDocument()

    // Check that the input starts at 1
    expect(screen.getByText('1')).toBeInTheDocument()

    // Check for the main submit button
    expect(screen.getByRole('button', { name: 'コーヒーを記録' })).toBeInTheDocument()
  })

  it('should increment and decrement the number of cups to add', () => {
    render(<CoffeeInput onAddCoffee={jest.fn()} todayCups={0} />)

    const incrementButton = screen.getByRole('button', { name: 'Increment coffee cups' })
    const decrementButton = screen.getByRole('button', { name: 'Decrement coffee cups' })

    // Initial value is 1
    expect(screen.getByText('1')).toBeInTheDocument()

    // Click increment
    fireEvent.click(incrementButton)
    expect(screen.getByText('2')).toBeInTheDocument()

    // Click increment again
    fireEvent.click(incrementButton)
    expect(screen.getByText('3')).toBeInTheDocument()

    // Click decrement
    fireEvent.click(decrementButton)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should not decrement below 1', () => {
    render(<CoffeeInput onAddCoffee={jest.fn()} todayCups={0} />)
    const decrementButton = screen.getByRole('button', { name: 'Decrement coffee cups' })

    // Initial value is 1
    expect(screen.getByText('1')).toBeInTheDocument()

    // Click decrement
    fireEvent.click(decrementButton)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should call onAddCoffee with the correct number of cups when submit is clicked', () => {
    const mockOnAddCoffee = jest.fn()
    render(<CoffeeInput onAddCoffee={mockOnAddCoffee} todayCups={0} />)

    const incrementButton = screen.getByRole('button', { name: 'Increment coffee cups' })
    const submitButton = screen.getByRole('button', { name: 'コーヒーを記録' })

    // Increment to 3 cups
    fireEvent.click(incrementButton)
    fireEvent.click(incrementButton)

    // Submit
    fireEvent.click(submitButton)

    // Check if the callback was called with 3
    expect(mockOnAddCoffee).toHaveBeenCalledWith(3)
    expect(mockOnAddCoffee).toHaveBeenCalledTimes(1)
  })

  it('should reset the number of cups to 1 after submission', () => {
    render(<CoffeeInput onAddCoffee={jest.fn()} todayCups={0} />)
    const incrementButton = screen.getByRole('button', { name: 'Increment coffee cups' })
    const submitButton = screen.getByRole('button', { name: 'コーヒーを記録' })

    fireEvent.click(incrementButton) // cups is now 2
    expect(screen.getByText('2')).toBeInTheDocument()

    fireEvent.click(submitButton)

    // After submission, the counter should reset to 1
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
